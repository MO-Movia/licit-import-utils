/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

export function normalize(
  input: string,
  fixes: string[]
): string {

  let out = input.trim();

  if (out !== out.toUpperCase()) {
    fixes?.push("Normalized to uppercase");
    out = out.toUpperCase();
  }

  if (/[()]/.test(out)) {
    fixes.push("Removed parentheses");
    out = out.replaceAll(/[()]/g, "");
  }

  out = out
    .replaceAll(/\s{0,10}\/\/\s{0,10}/g, "//")
    .replaceAll(/\s{0,10}\/\s{0,10}/g, "/")
    .replaceAll(/\s{0,10},\s{0,10}/g, ", ");

  return out;
}