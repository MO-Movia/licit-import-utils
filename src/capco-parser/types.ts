/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

export interface ISM {
  version: "1";
  classification: string[];
  ownerProducer: string;
  sciControls?: string[];
  sarIdentifiers?: string[];
  atomicEnergyMarkings?: string[];
  fgiSourceOpen?: string[];
  releasableTo?: string[];
  disseminationControls?: string[];
  nonICmarkings?: string[];
}

export interface ParseResult {
  ism: ISM;
  portionMarking: string;
  finalMarking: string;
  rawTextPreserved: boolean;
  originalText?: string;
  fixes?: string[];
  errors?: string[];
}
