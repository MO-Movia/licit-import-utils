/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import { ISM, ParseResult } from "./types";
import { LEVELS, SCI, NON_IC } from "./constants";
import { normalize } from "./normalize";
import { isBannerMarking, hasRelToNofornConflict } from "./validate";
import { parseFGIPortion } from "./fgi";

function emptyISM(): ISM {
  return {
    version: "1",
    classification: [],
    ownerProducer: "USA",
    sciControls: [],
    sarIdentifiers: [],
    atomicEnergyMarkings: [],
    fgiSourceOpen: [],
    releasableTo: [],
    disseminationControls: [],
    nonICmarkings: []
  };
}

function tbdResult(raw: string, errors?: string[]): ParseResult {
  return {
    ism: {
      ...emptyISM(),
      classification: ["TBD"]
    },
    portionMarking: "TBD",        // ← canonical
    finalMarking: "(TBD)",        // ← display only
    rawTextPreserved: true,
    originalText: raw,
    errors
  };
}

export function parsePortionMarking(
  input: string,
  level: 1 | 2 | 3
): ParseResult {

  const fixes: string[] = [];
  const errors: string[] = [];

  const clean = normalize(input, fixes);
  const ism = emptyISM();

  if (!clean) return tbdResult(input);

  // Explicitly ignore banners
  if (isBannerMarking(clean)) {
    return tbdResult(input);
  }

  const isAllowed = (cls: string) => LEVELS[level].includes(cls);

  /* ---------- FGI PORTION ---------- */
  const fgi = parseFGIPortion(clean, isAllowed);
  if (fgi) {
    ism.classification = [fgi.classification];
    ism.fgiSourceOpen = fgi.sources;

    return {
      ism,
      portionMarking: clean,          // ← NO parentheses
      finalMarking: `(${clean})`,     // ← display only
      rawTextPreserved: false,
      fixes
    };
  }

  /* ---------- STANDARD PORTION ---------- */
  const tokens = clean.split("//");
  const cls = tokens.shift();

  if (!isAllowed(cls)) {
    return tbdResult(input);
  }

  ism.classification = [cls];

  for (const token of tokens) {
    const t = token.trim();

    if (t.startsWith("REL TO")) {
      ism.releasableTo = t
        .replace("REL TO", "")
        .split(",")
        .map(c => c.trim());
    }
    else if (SCI.some(s => t.includes(s))) {
      ism.sciControls.push(...t.split("/"));
    }
    else if (t.startsWith("SAR")) {
      ism.sarIdentifiers.push(t);
    }
    else if (NON_IC.some(n => t.includes(n))) {
      ism.nonICmarkings.push(t);
    }
    else {
      // Dissemination controls may be chained with single '/'
      const parts = t.split("/").map(p => p.trim()).filter(Boolean);
      ism.disseminationControls.push(...parts);
    }
  }

  if (hasRelToNofornConflict(clean)) {
    errors.push("Security conflict: NOFORN and REL TO cannot coexist");
    return tbdResult(input, errors);
  }

  return {
    ism,
    portionMarking: clean,          // ← NO parentheses
    finalMarking: `(${clean})`,     // ← display only
    rawTextPreserved: false,
    fixes
  };
}
