// Formats d'affichage, en français.

const NBSP = " "; // espace insécable : "13 000 F" ne se coupe jamais en fin de ligne

/** 13000 -> "13 000 F" */
export function formatMoney(amount: number): string {
  return `${formatNumber(Math.round(amount))}${NBSP}F`;
}

/** 13000 -> "13 000" (séparateur de milliers : espace) */
export function formatNumber(n: number): string {
  const sign = n < 0 ? "-" : "";
  const digits = String(Math.abs(Math.trunc(n)));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** Lit un nombre saisi par un humain : "13 000", "13000 F", "30,5" -> nombre, ou null. */
export function parseNumberInput(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\s  F]/gi, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
