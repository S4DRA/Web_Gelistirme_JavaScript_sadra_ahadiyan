import { createHash } from "crypto";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { TransactionType } from "@prisma/client";
import { normalizeCurrency, roundMoney } from "@/lib/currency";

export type ImportRowStatus = "ready" | "duplicate" | "invalid";

export type ImportPreviewRow = {
  amount: number;
  balance: number | null;
  category: string;
  convertedAmount: number;
  currency: string;
  date: string;
  description: string;
  duplicate: boolean;
  errors: string[];
  fingerprint: string;
  note: string | null;
  rowNumber: number;
  status: ImportRowStatus;
  type: "income" | "expense";
};

type RawImportRow = Record<string, unknown>;

const MAX_IMPORT_ROWS = 500;
const RAW_BALANCE = "balance";
const RAW_CURRENCY = "__currency";
const RAW_ROW_NUMBER = "__rowNumber";

export function parseImportFile(buffer: Buffer, fileName: string, mimeType: string) {
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith(".csv") || mimeType.includes("csv")) {
    return parse(buffer.toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as RawImportRow[];
  }

  if (lowerName.endsWith(".xlsx") || mimeType.includes("spreadsheet")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return [];
    }

    return rowsFromWorksheet(workbook.Sheets[firstSheetName]);
  }

  throw new Error("Upload a .csv or .xlsx file.");
}

export function ensureImportSize(rows: RawImportRow[]) {
  if (rows.length === 0 || rows.length > MAX_IMPORT_ROWS) {
    throw new Error("Import between 1 and 500 transactions.");
  }
}

export async function buildImportPreview({
  baseCurrency,
  convertAmount,
  duplicateFingerprints,
  rows,
}: {
  baseCurrency: string;
  convertAmount: (
    amount: number,
    currency: string,
  ) => Promise<{ amount: number; exchangeRate: number }>;
  duplicateFingerprints: Set<string>;
  rows: RawImportRow[];
}) {
  ensureImportSize(rows);

  return Promise.all(
    rows.map(async (row, index) => {
      const rawRowNumber = Number(row[RAW_ROW_NUMBER]);
      const normalized = normalizeImportRow(
        row,
        Number.isFinite(rawRowNumber) ? rawRowNumber : index + 2,
        baseCurrency,
      );

      if (normalized.errors.length > 0) {
        return normalized;
      }

      const converted = await convertAmount(normalized.amount, normalized.currency);
      const convertedAmount = roundMoney(converted.amount);
      const fingerprint = createTransactionFingerprint({
        amount: convertedAmount,
        category: normalized.category,
        date: normalized.date,
        note: normalized.note,
        type: normalized.type,
      });
      const duplicate = duplicateFingerprints.has(fingerprint);

      return {
        ...normalized,
        convertedAmount,
        duplicate,
        fingerprint,
        status: duplicate ? "duplicate" : "ready",
      } satisfies ImportPreviewRow;
    }),
  );
}

export function createTransactionFingerprint({
  amount,
  category,
  date,
  note,
  type,
}: {
  amount: number;
  category: string;
  date: string;
  note?: string | null;
  type: string;
}) {
  return createHash("sha256")
    .update(
      [
        type.toLowerCase(),
        roundMoney(amount).toFixed(2),
        category.trim().toLowerCase(),
        date.slice(0, 10),
        (note ?? "").trim().toLowerCase(),
      ].join("|"),
    )
    .digest("hex");
}

function normalizeImportRow(
  row: RawImportRow,
  rowNumber: number,
  baseCurrency: string,
): ImportPreviewRow {
  const rawType = readField(row, ["type", "transaction type", "tip", "islem tipi"])
    .toLowerCase()
    .trim();
  const description = readField(row, ["description", "explanation", "aciklama"]);
  const category = readField(row, ["category", "kategori"]) || inferCategory(description);
  const voucherNo = readField(row, ["fis no", "receipt no", "reference"]);
  const note = readField(row, ["note", "notes", "description", "explanation", "aciklama"]) || null;
  const currency = normalizeCurrency(
    readField(row, ["currency", "para birimi", "doviz"]) ||
      detectCurrencyInText(Object.values(row).join(" ")) ||
      String(row[RAW_CURRENCY] ?? "") ||
      inferCurrencyFromRow(row) ||
      baseCurrency,
    baseCurrency,
  );
  const signedAmount = parseLocalizedAmount(
    readField(row, [
      "amount",
      "income",
      "expense",
      "transaction amount",
      "islem tutari",
      "tutar",
    ]),
  );
  const amount = Math.abs(signedAmount);
  const rawDate = readRawField(row, ["date", "transaction date", "tarih"]);
  const parsedDate = normalizeImportDateValue(rawDate);
  const balance = parseLocalizedAmount(readField(row, [RAW_BALANCE, "bakiye"]));
  const errors: string[] = [];
  const type =
    rawType === TransactionType.income || rawType === "gelir"
      ? TransactionType.income
      : rawType === TransactionType.expense || rawType === "gider"
        ? TransactionType.expense
        : signedAmount < 0
          ? TransactionType.expense
          : TransactionType.income;

  if (type !== TransactionType.income && type !== TransactionType.expense) {
    errors.push("Type must be income or expense.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Amount must be greater than 0.");
  }

  if (!category) {
    errors.push("Category is required.");
  }

  if (!parsedDate) {
    errors.push("Date must be valid.");
  }

  return {
    amount: Number.isFinite(amount) ? amount : 0,
    balance: Number.isFinite(balance) ? balance : null,
    category,
    convertedAmount: 0,
    currency,
    date: parsedDate ?? "",
    description,
    duplicate: false,
    errors,
    fingerprint: "",
    note: [voucherNo ? `Receipt no: ${voucherNo}` : "", note].filter(Boolean).join(" | ") || null,
    rowNumber,
    status: errors.length > 0 ? "invalid" : "ready",
    type: type === TransactionType.expense ? "expense" : "income",
  };
}

function rowsFromWorksheet(worksheet: XLSX.WorkSheet) {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    defval: "",
    header: 1,
    raw: false,
  });
  const detectedHeader = findBankStatementHeader(matrix);

  if (!detectedHeader) {
    return XLSX.utils.sheet_to_json<RawImportRow>(worksheet, { defval: "" });
  }

  const { columns, headerIndex } = detectedHeader;
  const headers = matrix[headerIndex].map((cell) => String(cell).trim());
  const sheetCurrency = detectCurrencyInText(
    matrix
      .slice(0, headerIndex)
      .flat()
      .join(" "),
  );
  const rows: RawImportRow[] = [];

  for (let rowIndex = headerIndex + 1; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex];

    if (isEmptySheetRow(row)) {
      break;
    }

    const rawDate = row[columns.date] ?? "";
    const rawAmount = String(row[columns.amount] ?? "").trim();

    if (!normalizeImportDateValue(rawDate) || !Number.isFinite(parseLocalizedAmount(rawAmount))) {
      if (isFooterRow(row)) {
        break;
      }

      if (isSummaryRow(row)) {
        continue;
      }

      break;
    }

    const result: RawImportRow = {
      [RAW_BALANCE]: row[columns.balance] ?? "",
      [RAW_CURRENCY]: sheetCurrency,
      [RAW_ROW_NUMBER]: rowIndex + 1,
      amount: row[columns.amount] ?? "",
      date: rawDate,
      description: row[columns.description] ?? "",
    };

    headers.forEach((header, columnIndex) => {
      if (header && result[header] === undefined) {
        result[header] = row[columnIndex] ?? "";
      }
    });

    rows.push(result);
  }

  return rows;
}

function findBankStatementHeader(matrix: unknown[][]) {
  for (let headerIndex = 0; headerIndex < matrix.length; headerIndex += 1) {
    const normalizedCells = matrix[headerIndex].map((cell) => normalizeText(String(cell)));
    const columns = {
      amount: findHeaderColumn(normalizedCells, ["transaction amount", "islem tutari"]),
      balance: findHeaderColumn(normalizedCells, ["balance", "bakiye"]),
      date: findHeaderColumn(normalizedCells, ["date", "transaction date", "tarih"]),
      description: findHeaderColumn(normalizedCells, ["explanation", "description", "aciklama"]),
    };

    if (
      columns.amount >= 0 &&
      columns.balance >= 0 &&
      columns.date >= 0 &&
      columns.description >= 0
    ) {
      return { columns, headerIndex };
    }
  }

  return null;
}

function findHeaderColumn(values: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeText);
  return values.findIndex((value) => normalizedAliases.includes(value));
}

function readField(row: RawImportRow, aliases: string[]) {
  const value = readRawField(row, aliases);

  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function readRawField(row: RawImportRow, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeText);
  const key = Object.keys(row).find((item) => normalizedAliases.includes(normalizeText(item)));
  return key ? row[key] : "";
}

export function normalizeImportDateValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return parseExcelSerialDate(value);
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  if (/^\d+(\.\d+)?$/.test(text)) {
    const serialDate = parseExcelSerialDate(Number(text));

    if (serialDate) {
      return serialDate;
    }
  }

  const isoDate = text.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);

  if (isoDate) {
    return formatValidDateParts(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]));
  }

  const localDate = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);

  if (localDate) {
    const first = Number(localDate[1]);
    const second = Number(localDate[2]);
    const year = Number(localDate[3]);
    const month = first > 12 ? second : second > 12 ? first : second;
    const day = first > 12 ? first : second > 12 ? second : first;

    return formatValidDateParts(year, month, day);
  }

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function parseExcelSerialDate(value: number) {
  if (!Number.isFinite(value) || value < 1 || value > 100000) {
    return null;
  }

  const parsed = XLSX.SSF.parse_date_code(value);

  if (!parsed) {
    return null;
  }

  return formatValidDateParts(parsed.y, parsed.m, parsed.d);
}

function formatValidDateParts(year: number, month: number, day: number) {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1900 ||
    year > 2200 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function normalizeText(value: string) {
  return value
    .trim()
    .replace(/\u0130/g, "I")
    .replace(/\u0131/g, "i")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
}

function isEmptySheetRow(row: unknown[]) {
  return row.every((cell) => String(cell ?? "").trim() === "");
}

function isFooterRow(row: unknown[]) {
  const text = normalizeText(row.join(" "));

  return [
    "amount owed",
    "recipient",
    "iban",
    "account no",
    "customer name",
    "legal",
    "terms",
    "this statement",
    "bu dokuman",
    "musteri",
  ].some((footerText) => text.includes(footerText));
}

function isSummaryRow(row: unknown[]) {
  const text = normalizeText(row.join(" "));

  return ["amount owed", "recipient", "total", "summary", "toplam"].some((summaryText) =>
    text.includes(summaryText),
  );
}

function parseLocalizedAmount(value: string) {
  const trimmed = value
    .replace(/\s/g, "")
    .replace(/[\u20ba$€£]/g, "")
    .replace(/^TL/i, "")
    .replace(/TL$/i, "")
    .replace(/^TRY/i, "")
    .replace(/TRY$/i, "");

  if (!trimmed) {
    return Number.NaN;
  }

  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");
  const commaParts = trimmed.split(",");
  const normalized =
    hasComma && hasDot
      ? trimmed.replace(/\./g, "").replace(",", ".")
      : hasComma && commaParts.at(-1)?.length === 3
        ? trimmed.replace(/,/g, "")
        : hasComma
          ? trimmed.replace(",", ".")
          : trimmed;

  return Number(normalized);
}

function inferCategory(description: string) {
  if (!description) {
    return "";
  }

  const normalizedDescription = normalizeText(description);

  if (normalizedDescription.includes("google") || normalizedDescription.includes("discord")) {
    return "Software";
  }

  if (normalizedDescription.includes("yemek") || normalizedDescription.includes("bonveno")) {
    return "Food";
  }

  if (normalizedDescription.includes("bim") || normalizedDescription.includes("market")) {
    return "Groceries";
  }

  if (normalizedDescription.includes("pos") || normalizedDescription.includes("alisveris")) {
    return "Card purchase";
  }

  if (normalizedDescription.includes("fast") || normalizedDescription.includes("eft")) {
    return "Transfer";
  }

  return "Imported";
}

function inferCurrencyFromRow(row: RawImportRow) {
  return detectCurrencyInText(Object.values(row).join(" "));
}

function detectCurrencyInText(value: string) {
  const normalizedValue = normalizeText(value);
  const upperValue = value.toUpperCase();

  if (normalizedValue.includes(" tl") || normalizedValue.includes("turk lirasi")) {
    return "TRY";
  }

  if (upperValue.includes("$") || /\bUSD\b/.test(upperValue)) {
    return "USD";
  }

  if (upperValue.includes("\u20ac") || /\bEUR\b/.test(upperValue)) {
    return "EUR";
  }

  if (upperValue.includes("\u00a3") || /\bGBP\b/.test(upperValue)) {
    return "GBP";
  }

  if (/\bAED\b/.test(upperValue)) {
    return "AED";
  }

  if (/\bIRR\b/.test(upperValue)) {
    return "IRR";
  }

  return "";
}
