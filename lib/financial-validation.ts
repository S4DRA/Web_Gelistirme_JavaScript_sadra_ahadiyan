export const MAX_MONEY_AMOUNT = 999_999_999.99;
export const MAX_SHORT_TEXT_LENGTH = 80;
export const MAX_NOTE_LENGTH = 500;

export function cleanShortText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function isValidShortText(value: string) {
  return value.length > 0 && value.length <= MAX_SHORT_TEXT_LENGTH;
}

export function cleanOptionalNote(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const note = value.trim().replace(/\s+/g, " ");
  return note.length > 0 ? note.slice(0, MAX_NOTE_LENGTH) : null;
}

export function parsePositiveMoney(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_MONEY_AMOUNT) {
    return null;
  }

  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function parseNonNegativeMoney(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_MONEY_AMOUNT) {
    return null;
  }

  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
