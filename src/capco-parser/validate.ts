/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

export function isBannerMarking(clean: string): boolean {
  return /^(SECRET|TOP SECRET|CONFIDENTIAL|UNCLASSIFIED)/.test(clean);
}

export function hasRelToNofornConflict(clean: string): boolean {
  return clean.includes("NF") && clean.includes("REL TO");
}
