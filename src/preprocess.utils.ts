/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import type { Message } from './types';
import JSZip from 'jszip';
import { DocxTransformer } from './transform.docx';

export async function extractStylesForDoc(
  arrayBuffer: ArrayBuffer,
  docType: string
): Promise<{ styles: string[] }> {
  const messages: Message[] = [];
  // Convert the ArrayBuffer to HTML using Mammoth.js
  await new DocxTransformer(docType, (type, message) =>
    messages.push({ type, message })
  ).transform(arrayBuffer);

  // Extract styles from the HTML (adapt as needed for your styling approach)
  const styles = extractUniqueStyleIds(messages);
  return { styles };
}

export function extractUniqueStyleIds(data: Message[]): string[] {
  const styleIds: string[] = [];
  data ??= [];
  for (const item of data) {
    const match = new RegExp(/Style ID: (.{0,100}?)(?=\))/).exec(item.message);
    const styleId = match?.[1];
    if (styleId && !styleIds.includes(styleId)) {
      styleIds.push(styleId);
    }
  }
  return styleIds;
}
export function extractStylesForJSON(
  arrayBuffer: ArrayBuffer
): Promise<{ content: string; styles: string[] }> {
  const decoder = new TextDecoder('utf-8');
  const content = decoder.decode(arrayBuffer);
  const jsonObject = JSON.parse(content);

  if (typeof jsonObject !== 'object' || jsonObject === null) {
    throw new Error('Invalid JSON document');
  }

  const styles: string[] = [];
  collectStyles(jsonObject, styles);

  return Promise.resolve({ content, styles });
}

// Preprocessor to handle the JSON formatted documents
export function collectStyles(obj: unknown, styles: string[] = []): string[] {
  if (typeof obj !== 'object' || obj === null) {
    return styles;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      // Recursively traverse nested objects
      collectStyles(value, styles);
    } else if (
      key === 'styleName' &&
      typeof value === 'string' &&
      !styles.includes(value)
    ) {
      // Add the style name to the list if it's not already included
      styles.push(value);
    }
  }
  return styles;
}

export function processHTML(
  arrayBuffer: ArrayBuffer
): Promise<{ styles: string[] }> {
  return new Promise<{ styles: string[] }>((resolve) => {
    const content = arrayBufferToString(arrayBuffer);
    // Use DOMParser to parse HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    // Extract style names using regular expressions
    const styleNames = extractStyleNamesFromHTML(doc);
    resolve({ styles: styleNames });
  });
}
export async function extractStylesFromZip(zipFile: File) {
  const MAX_FILES = 10000;
  const MAX_SIZE = 1073741824; // 1 GB
  if (
    zipFile.size > MAX_SIZE &&
    !confirm(`zip is ${zipFile.size / MAX_SIZE} GB. continue?`)
  ) {
    throw new Error('Size of the file is more than the limit 25 mb');
  }
  const loadedZip = await JSZip.loadAsync(zipFile); //NOSONAR size validated. Safe to extract.
  // Check if the total number of files exceeds the limit
  const totalFiles = Object.keys(loadedZip.files).length;
  if (
    totalFiles > MAX_FILES &&
    !confirm(`zip contains an excessive ${totalFiles} files. continue?`)
  ) {
    throw new Error(
      `Number of files in the zip (${totalFiles}) exceeds the limit (${MAX_FILES})`
    );
  }
  const htmlFiles = Object.keys(loadedZip.files).filter((fileName) =>
    fileName.endsWith('.htm')
  );
  let combinedStyles: string[] = [];
  for (const fileName of htmlFiles) {
    const arrayBuffer = await loadedZip.files[fileName].async('arraybuffer');
    const { styles } = await processHTML(arrayBuffer);
    // Combine styles
    combinedStyles = [...new Set([...combinedStyles, ...styles])];
  }
  return { styles: combinedStyles };
}
export function arrayBufferToString(arrayBuffer: ArrayBuffer): string {
  return new TextDecoder().decode(new Uint8Array(arrayBuffer));
}

export function extractStyleNamesFromHTML(doc: Document): string[] {
  const styleNames: string[] = [];
  // Extract class names from HTML elements and add to style names
  const elementsWithClass = doc.querySelectorAll('[class]');
  for (const element of Array.from(elementsWithClass)) {
    const classes = element.className.split(/\s+/); // Split by whitespace
    styleNames.push(...classes);
  }

  // Return unique style names
  return [...new Set(styleNames)];
}
