import { createHash } from "crypto";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { TransactionType } from "@prisma/client";
import { normalizeCurrency, roundMoney } from "@/lib/currency";

export type ImportRowStatus = "ready" | "duplicate" | "invalid";

export type ImportPreviewRow = {
  amount: number;
  category: string;
  convertedAmount: number;
  currency: string;
  date: string;
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
  const description = readField(row, ["description", "aciklama"]);
  const category = readField(row, ["category", "kategori"]) || inferCategory(description);
  const voucherNo = readField(row, ["fis no", "receipt no", "reference"]);
  const note = readField(row, ["note", "notes", "description", "aciklama"]) || null;
  const currency = normalizeCurrency(
    readField(row, ["currency", "para birimi", "doviz"]) ||
      detectCurrencyInText(Object.values(row).join(" ")) ||
      String(row[RAW_CURRENCY] ?? "") ||
      inferCurrencyFromRow(row) ||
      baseCurrency,
    baseCurrency,
  );
  const signedAmount = parseLocalizedAmount(
    readField(row, ["amount", "income", "expense", "islem tutari", "tutar"]),
  );
  const amount = Math.abs(signedAmount);
  const rawDate = readField(row, ["date", "transaction date", "tarih"]);
  const parsedDate = parseImportDate(rawDate);
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
    category,
    convertedAmount: 0,
    currency,
    date: parsedDate ?? "",
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
  const headerIndex = matrix.findIndex((row) => {
    const normalizedCells = row.map((cell) => normalizeText(String(cell)));

    return (
      hasAny(normalizedCells, ["date", "transaction date", "tarih"]) &&
      hasAny(normalizedCells, ["amount", "islem tutari", "tutar"])
    );
  });

  if (headerIndex < 0) {
    return XLSX.utils.sheet_to_json<RawImportRow>(worksheet, { defval: "" });
  }

  const headers = matrix[headerIndex].map((cell) => String(cell).trim());
  const sheetCurrency = detectCurrencyInText(
    matrix
      .slice(0, headerIndex)
      .flat()
      .join(" "),
  );
  const dateColumnIndex = headers.findIndex((header) =>
    ["date", "transaction date", "tarih"].includes(normalizeText(header)),
  );
  const amountColumnIndex = headers.findIndex((header) =>
    ["amount", "income", "expense", "islem tutari", "tutar"].includes(
      normalizeText(header),
    ),
  );

  return matrix
    .slice(headerIndex + 1)
    .map((row, offset) => ({ offset, row }))
    .filter(({ row }) => {
      const rawDate = String(row[dateColumnIndex] ?? "").trim();
      const rawAmount = String(row[amountColumnIndex] ?? "").trim();

      return Boolean(parseImportDate(rawDate)) && Number.isFinite(parseLocalizedAmount(rawAmount));
    })
    .map(({ offset, row }) => {
      const result: RawImportRow = {
        [RAW_CURRENCY]: sheetCurrency,
        [RAW_ROW_NUMBER]: headerIndex + offset + 2,
      };

      headers.forEach((header, columnIndex) => {
        if (header) {
          result[header] = row[columnIndex] ?? "";
        }
      });

      return result;
    });
}

function readField(row: RawImportRow, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeText);
  const key = Object.keys(row).find((item) => normalizedAliases.includes(normalizeText(item)));
  const value = key ? row[key] : "";

  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function parseImportDate(value: string) {
  if (!value) {
    return null;
  }

  const localDate = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);

  if (localDate) {
    return [
      localDate[3],
      localDate[2].padStart(2, "0"),
      localDate[1].padStart(2, "0"),
    ].join("-");
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
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

function hasAny(values: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeText);
  return values.some((value) => normalizedAliases.includes(value));
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
