/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import { parsePortionMarking } from "./capco-parser";
import { ISM, ParseResult } from "./capco-parser/types";

const DEFAULT_PORTION = 'U';

export interface UpdatedCapco {
  capco: ParseResult;
  updatedTextContent: string;
}
// System Capcos list.
const systemCapcos = ['TBD', 'U', 'C', 'S', 'TS', 'CUI', 'FOUO'];
const capcoMap: Record<string, string> = {
  'TO BE DETERMINED': 'TBD',
  UNCLASSIFIED: 'U',
  CONFIDENTIAL: 'C',
  SECRET: 'S',
  'TOP SECRET': 'TS',
  'CONTROLLED UNCLASSIFIED INFORMATION': 'CUI',
  'FOR OFFICIAL USE ONLY': 'FOUO',
};

export function updateCapcoFromContent(
  element: Element
): UpdatedCapco | undefined {
  let text = element.textContent?.trimStart() ?? '';
  if (element.parentElement?.tagName === 'SPAN' && !extractLeadingPortionMarking(text)) {
    text = element.parentElement?.parentElement?.textContent?.trimStart() ?? '';
  }

  const defIsm: ISM = {
    version: "1",
    classification: ['U'],
    ownerProducer: "USA",
    sciControls: [],
    sarIdentifiers: [],
    atomicEnergyMarkings: [],
    fgiSourceOpen: [],
    releasableTo: [],
    disseminationControls: [],
    nonICmarkings: []
  };

  const defaultCapco: ParseResult = {
    ism: defIsm,
    portionMarking: DEFAULT_PORTION,
    finalMarking: `(${DEFAULT_PORTION})`,
    rawTextPreserved: false,
  };

  const extracted = extractLeadingPortionMarking(text);
  if (!extracted) {
    return {
      capco: defaultCapco,
      updatedTextContent: text
    };
  }

  const { inner, rest } = extracted;
  const parsed = parsePortionMarking(inner, 3);

  // ✅ recognized CAPCO
  if (!parsed.rawTextPreserved) {
    return {
      capco: {
        ism: parsed.ism,
        portionMarking: parsed.portionMarking,
        finalMarking: `(${parsed.portionMarking})`,
        rawTextPreserved: false
      },
      updatedTextContent: rest
    };
  }

  // ❌ unrecognized CAPCO
  return {
    capco: {
      ism: undefined,
      portionMarking: 'TBD',
      finalMarking: '(TBD)',
      rawTextPreserved: false
    },
    updatedTextContent: text
  };
}

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * Extracts a leading "(...)" portion marking.
 * Only the first paragraph-level marking is considered.
 */
function extractLeadingPortionMarking(
  text: string
): { inner: string; rest: string } | null {
  const trimmed = text?.trimStart();

  // Must start with '('
  if (!trimmed?.startsWith('(')) {
    return null;
  }

  const closeIdx = trimmed.indexOf(')');
  if (closeIdx <= 1) {
    return null;
  }

  const inner = trimmed.substring(1, closeIdx).trim();
  const rest = trimmed.substring(closeIdx + 1).trimStart();
  return { inner, rest };
}

//Generic function to return capco string for corresponding capco name
export function getShortCapcoString(capcoName: string): string {
  return capcoMap[capcoName] || 'U';
}
//Get capco Names
export function getCapcoNames(): string[] {
  return Object.keys(capcoMap);
}

export function getCapcoFromNode(node: HTMLElement): string | null | undefined {
  return (
    node?.getAttribute('capco') ??
    node?.querySelector('span')?.getAttribute('capco')
  );
}

export function safeCapcoParse(capco: unknown, fallback?: ParseResult): ParseResult {
  const defaultFallBack: ParseResult = {
    ism: undefined,
    portionMarking: 'error',
    finalMarking: '(error)',
    rawTextPreserved: false
  };
  fallback = fallback ?? defaultFallBack;

  if (capco && typeof capco === 'string') {
    try {
      return JSON.parse(capco) as ParseResult;
    } catch (e) {
      console.warn('could not parse capco text: ' + capco, e);
    }
  }

  if (capco && typeof capco === 'object') {
    return capco as ParseResult;
  }

  return fallback;
}
export function removeCapcoTextFromNode(node: Node) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      let text = child.textContent ?? '';

      for (const systemCapco of systemCapcos) {
        const marker = `(${systemCapco.toUpperCase()})`;

        // check only at the start
        if (text.trimStart().toUpperCase().startsWith(marker)) {
          // remove only the first occurrence at the beginning
          text = text.trimStart().substring(marker.length).trimStart();
          child.textContent = text;
          break; // no need to check other markers
        }
      }
    } else if (child.hasChildNodes()) {
      // recurse into nested elements
      removeCapcoTextFromNode(child);
    }
  }
}
