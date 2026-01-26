/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

export interface Capco {
  portionMarking?: string;
  ism: ISM;
}
interface ISM {
  system: string;
  classification: string;
  joint?: boolean;
  ownerProducer?: string[];
  atomicEnergyMarkings?: string[];
  declassExceptions?: string[];
  displayOnlyTo?: string[];
  disseminationControls?: string[];
  fgiSourceOpen?: string[];
  fgiSourceProtected?: string[];
  nonICMarkings?: string[];
  nonUSControls?: string[];
  releasableTo?: string[];
  sciControls?: string[];
}

export interface UpdatedCapco {
  containsCapco: boolean;
  capco: Capco;
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

const UNCLASSIFIED = 'U';

export function updateCapcoFromContent(
  element: Element
): UpdatedCapco | undefined {
  const capco: Capco = {
    ism: {
      classification: UNCLASSIFIED,
      system: 'USA',
      ownerProducer: [],
      sciControls: [],
      atomicEnergyMarkings: [],
      disseminationControls: [],
    },
    portionMarking: 'U',
  };

  const textContent = element.textContent?.trimStart();
  const updatedTextContent = textContent;

  // Handle various CAPCO combinations
  if (textContent) {
    const upperText = textContent.toUpperCase();

    // Check for (U) or (CUI) only - remove text
    const simpleResult = handleUAndCuiCapcos(textContent, upperText, capco);
    if (simpleResult) {
      return simpleResult;
    }

    // Check if starts with ( and contains //
    const doubleSlashResult = handleCapcoCombinations(
      upperText,
      updatedTextContent,
      capco
    );
    if (doubleSlashResult) {
      return doubleSlashResult;
    }

    // Check for full form without // - exact match with capcoMap values
    const fullFormResult = handleFullFormCapco(
      upperText,
      updatedTextContent,
      capco
    );
    if (fullFormResult) {
      return fullFormResult;
    }
  }
}

// Handle (U) and (CUI) CAPCOs
function handleUAndCuiCapcos(
  textContent: string,
  upperText: string,
  capco: Capco
): UpdatedCapco | null {
  if (upperText.startsWith('(U)') || upperText.startsWith('(CUI)')) {
    const isU = upperText.startsWith('(U)');
    const marker = isU ? '(U)' : '(CUI)';
    const portionMark = isU ? 'U' : 'CUI';

    capco.ism.classification = UNCLASSIFIED;
    capco.portionMarking = portionMark;

    // Remove the CAPCO text
    const updatedTextContent = textContent.slice(marker.length).trimStart();
    return { containsCapco: true, capco, updatedTextContent };
  }
  return null;
}

// Handle CAPCO combinations with //
function handleCapcoCombinations(
  upperText: string,
  updatedTextContent: string,
  capco: Capco
): UpdatedCapco | null {
  if (upperText.startsWith('(') && upperText.includes('//')) {
    const closingParenIndex = upperText.indexOf(')');
    if (closingParenIndex > 0) {
      const insideBracket = upperText.substring(1, closingParenIndex);

      // Check if it starts with any systemCapco letter followed by //
      for (const systemCapco of systemCapcos) {
        if (insideBracket.startsWith(`${systemCapco}//`)) {
          capco.ism.classification = UNCLASSIFIED;
          capco.portionMarking = 'TBD';
          // Keep the original text as is
          return { containsCapco: true, capco, updatedTextContent };
        }
      }

      // Check if it starts with any capcoMap full form followed by //
      const capcoMapResult = checkCapcoMap(
        insideBracket,
        capco,
        updatedTextContent
      );
      if (capcoMapResult) {
        return capcoMapResult;
      }
    }
  }
  return null;
}

// Check capcoMap full form with //
function checkCapcoMap(
  insideBracket: string,
  capco: Capco,
  updatedTextContent: string
): UpdatedCapco | null {
  for (const [fullForm] of Object.entries(capcoMap)) {
    if (insideBracket.startsWith(`${fullForm}//`)) {
      capco.ism.classification = UNCLASSIFIED;
      capco.portionMarking = 'TBD';
      // Keep the original text as is
      return { containsCapco: true, capco, updatedTextContent };
    }
  }
  return null;
}

// Full form CAPCO without //
function handleFullFormCapco(
  upperText: string,
  updatedTextContent: string,
  capco: Capco
): UpdatedCapco | null {
  if (upperText.startsWith('(')) {
    const closingParenIndex = upperText.indexOf(')');
    if (closingParenIndex > 0) {
      const insideBracket = upperText.substring(1, closingParenIndex).trim();

      // Check if it exactly matches any capcoMap full form
      for (const [fullForm] of Object.entries(capcoMap)) {
        if (insideBracket === fullForm) {
          capco.ism.classification = UNCLASSIFIED;
          capco.portionMarking = 'TBD';

          // Keep the original text as is
          return { containsCapco: true, capco, updatedTextContent };
        }
      }
    }
  }
  return null;
}
//Generic function to return capco string for corresponding capco name
export function getShortCapcoString(capcoName: string): string {
  return capcoMap[capcoName] || 'U';
}
//Get capco Names
export function getCapcoNames(): string[] {
  return Object.keys(capcoMap);
}
//Get Capco Name from short string. Eg: 'U' -> 'UNCLASSIFIED'
export function getCapcoNameFromShortString(
  capcoShort: string
): string | undefined {
  const name = Object.entries(capcoMap).find(
    ([_, value]) => value === capcoShort
  );
  return name?.[0];
}
//Generic function to convert capco string to capco object
export function getCapcoObject(capcoString: string): Capco {
  const capco: Capco = {
    ism: {
      classification: UNCLASSIFIED,
      system: 'USA',
      ownerProducer: [],
      sciControls: [],
      atomicEnergyMarkings: [],
      disseminationControls: [],
    },
    portionMarking: 'U',
  };
  if (capcoString && systemCapcos.includes(capcoString)) {
    capco.ism.classification = capcoString;
    capco.portionMarking = capcoString;
  }
  return capco;
}
export function getCapcoFromNode(node: HTMLElement): string | null | undefined {
  return (
    node?.getAttribute('capco') ??
    node?.querySelector('span')?.getAttribute('capco')
  );
}

export function safeCapcoParse(capco: unknown, fallback?: Capco): Capco {
  const defaultFallBack: Capco = {
    ism: undefined,
    portionMarking: 'error',
  };
  fallback = fallback ?? defaultFallBack;

  if (typeof capco === 'string') {
    try {
      return JSON.parse(capco) as Capco;
    } catch (e) {
      console.warn('could not parse capco text: ' + capco, e);
    }
  }

  if (capco && typeof capco === 'object') {
    return capco as Capco;
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
