/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

export interface FGIParseResult {
  classification: string;
  sources: string[];
}

export function parseFGIPortion(
  clean: string,
  isAllowed: (cls: string) => boolean
): FGIParseResult | null {

  if (!clean.startsWith("//")) return null;

  const parts = clean.replace("//", "").split(/\s{1,10}/);
  const cls = parts.pop();

  if (!isAllowed(cls)) return null;

  // Concealed source
  if (parts.length === 1 && parts[0] === "FGI") {
    return { classification: cls, sources: ["FGI"] };
  }

  // Identified sources
  if (parts.every(p => /^[A-Z]{3}$/.test(p))) {
    return { classification: cls, sources: parts.sort() };
  }

  return null;
}
