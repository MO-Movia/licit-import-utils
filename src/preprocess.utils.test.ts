/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 * @jest-environment jsdom
 */

import type { Message } from './types';
import * as DocumentPreprocessUtils from './preprocess.utils';

describe('DocumentPreprocessUtils', () => {
  let service = DocumentPreprocessUtils;
  beforeEach(() => {
    service = { ...DocumentPreprocessUtils };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should extract unique style IDs', () => {
    const data = [
      { message: 'Style ID: Style1' },
      { message: 'Style ID: Style2' },
      { message: 'Style ID: Style1' },
      { message: 'No Style ID' },
    ] as Message[];

    const result = service.extractUniqueStyleIds(data);

    expect(result).toEqual([]);
  });

  it('should handle empty data array', () => {
    const result = service.extractUniqueStyleIds([]);

    expect(result).toEqual([]);
  });

  it('should handle data array with no "Style ID"', () => {
    const data = [
      { message: 'No Style ID' },
      { message: 'Another message' },
    ] as Message[];

    const result = service.extractUniqueStyleIds(data);

    expect(result).toEqual([]);
  });

  it('should handle data array with no items', () => {
    const result = service.extractUniqueStyleIds(null);

    expect(result).toBeDefined();
  });

  it('should return an empty array when input is null', () => {
    expect(service.collectStyles(null, [])).toEqual([]);
  });

  it('should return an empty array when input is undefined', () => {
    expect(service.collectStyles(undefined, [])).toEqual([]);
  });

  it('should call collectStyles recursively and collect multiple values', () => {
    const obj = {
      styleName: 'value1',
      nested: {
        styleName: 'value2',
      },
    };

    const styles: string[] = ['value3'];
    const result = service.collectStyles(obj, styles);

    expect(result).toEqual(['value3', 'value1', 'value2']);
  });

  it('should handle nested objects and collect styles', () => {
    const obj = {
      styleName: 'value1',
      style2: 'value2',
      nested: {
        styleName: 'value3',
        deeper: {
          styleName: 'value4',
        },
      },
    };

    const styles: string[] = ['existingValue'];
    service.collectStyles(obj, styles);

    expect(styles).toContain('value1');
    expect(styles).toContain('value3');
    expect(styles).toContain('value4');
    expect(styles.length).toBe(4);
  });

  it('should not collect non-string properties', () => {
    const obj = {
      style1: 'value1',
      numericProperty: 42,
      booleanProperty: true,
      arrayProperty: [1, 2, 3],
    };

    const styles: string[] = ['value1'];
    service.collectStyles(obj, styles);

    expect(styles).toEqual(['value1']);
  });

  it('should handle an empty object', () => {
    const obj = {};

    const styles: string[] = [];
    service.collectStyles(obj, styles);

    expect(styles).toEqual([]);
  });

  it('should handle null and undefined input', () => {
    const styles: string[] = [];

    service.collectStyles(null, styles);
    expect(styles).toEqual([]);

    service.collectStyles(undefined, styles);
    expect(styles).toEqual([]);
  });

  it('should extract class names from style elements', () => {
    const documentContent = `
      <html>
        <head>
          <style>.style1 { color: red; }</style>
          <style>.style2 { font-size: 16px; }</style>
        </head>
        <body>
          <div class="content">Hello, world!</div>
        </body>
      </html>
    `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(documentContent, 'text/html');
    const classNames = service.extractStyleNamesFromHTML(doc);

    expect(classNames).toEqual(['content']);
  });

  it('should handle no style elements', () => {
    const documentContent = `
      <html>
        <head></head>
        <body>
          <div class="content">Hello, world!</div>
        </body>
      </html>
    `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(documentContent, 'text/html');
    const classNames = service.extractStyleNamesFromHTML(doc);

    expect(classNames).toEqual(['content']);
  });

  it('should handle empty style content', () => {
    const documentContent = `
      <html>
        <head>
          <style></style>
        </head>
        <body>
          <div class="content">Hello, world!</div>
        </body>
      </html>
    `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(documentContent, 'text/html');
    const classNames = service.extractStyleNamesFromHTML(doc);

    expect(classNames).toEqual(['content']);
  });

  it('should not reject for valid JSON document', async () => {
    const validJsonObject = '{"key": "value"}';
    await expect(
      service.extractStylesForJSON(stringToArrayBuffer(validJsonObject))
    ).resolves.toBeDefined();
  });

  it('should extract inline styles from HTML elements', () => {
    const htmlContent =
      '<div style="color: red; font-size: 16px;"></div>' +
      '<p style="margin: 10px; padding: 5px;"></p>' +
      '<span style="border: 1px solid #000;"></span>';

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const styleNames: string[] = [];
    service.extractStyleNamesFromHTML(doc);

    expect(styleNames).toEqual([]);
  });
});

function stringToArrayBuffer(str: string): ArrayBuffer {
  const encodedString = new TextEncoder().encode(str);
  const buffer = new ArrayBuffer(encodedString.length);
  const uint8Array = new Uint8Array(buffer);
  uint8Array.set(encodedString);

  return buffer;
}
