/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import { removeCapcoTextFromNode, updateCapcoFromContent } from './capco.util';

describe('CapcoService', () => {
  it('should handle (U) marking and remove it from text', () => {
    const element = document.createElement('div');
    element.textContent = '(U) This is unclassified content';

    const result = updateCapcoFromContent(element);

    expect(result.containsCapco).toBe(true);
    expect(result.capco.portionMarking).toBe('U');
    expect(result.capco.ism.classification).toBe('U');
    expect(result.updatedTextContent).toBe('This is unclassified content');
  });

  it('should handle (u) marking in lowercase', () => {
    const element = document.createElement('div');
    element.textContent = '(u) lowercase test';

    const result = updateCapcoFromContent(element);

    expect(result.containsCapco).toBe(true);
    expect(result.capco.portionMarking).toBe('U');
    expect(result.updatedTextContent).toBe('lowercase test');
  });

  it('should handle (CUI) marking and remove it from text', () => {
    const element = document.createElement('div');
    element.textContent = '(CUI) Controlled unclassified information';

    const result = updateCapcoFromContent(element);

    expect(result.containsCapco).toBe(true);
    expect(result.capco.portionMarking).toBe('CUI');
    expect(result.capco.ism.classification).toBe('U');
    expect(result.updatedTextContent).toBe(
      'Controlled unclassified information'
    );
  });

  it('should handle (cui) marking in lowercase', () => {
    const element = document.createElement('div');
    element.textContent = '(cui) test content';

    const result = updateCapcoFromContent(element);

    expect(result.containsCapco).toBe(true);
    expect(result.capco.portionMarking).toBe('CUI');
    expect(result.updatedTextContent).toBe('test content');
  });

  it('should handle system capco with // and keep original text', () => {
    const element = document.createElement('div');
    element.textContent = '(S//NF) Secret content';

    const result = updateCapcoFromContent(element);

    expect(result.containsCapco).toBe(true);
    expect(result.capco.portionMarking).toBe('TBD');
    expect(result.capco.ism.classification).toBe('U');
    expect(result.updatedTextContent).toBe('(S//NF) Secret content');
  });

  it('should handle full form capco with // and keep original text', () => {
    const element = document.createElement('div');
    element.textContent = '(SECRET//NOFORN) classified content';

    const result = updateCapcoFromContent(element);

    expect(result.containsCapco).toBe(true);
    expect(result.capco.portionMarking).toBe('TBD');
    expect(result.updatedTextContent).toBe(
      '(SECRET//NOFORN) classified content'
    );
  });

  it('should handle exact match full form without // and keep original text', () => {
    const element = document.createElement('div');
    element.textContent = '(SECRET) classified information';

    const result = updateCapcoFromContent(element);

    expect(result.containsCapco).toBe(true);
    expect(result.capco.portionMarking).toBe('TBD');
    expect(result.updatedTextContent).toBe('(SECRET) classified information');
  });

  it('should handle element with no text content', () => {
    const element = document.createElement('div');

    const result = updateCapcoFromContent(element);

    expect(result).toBeUndefined();
  });

  it('should handle element with empty text content', () => {
    const element = document.createElement('div');
    element.textContent = '';

    const result = updateCapcoFromContent(element);

    expect(result).toBeUndefined();
  });

  it('should handle element with whitespace-only text content', () => {
    const element = document.createElement('div');
    element.textContent = '   ';

    const result = updateCapcoFromContent(element);

    expect(result).toBeUndefined();
  });

  it('should handle text without CAPCO markings', () => {
    const element = document.createElement('div');
    element.textContent = 'Regular text without markings';

    const result = updateCapcoFromContent(element);

    expect(result).toBeUndefined();
  });

  it('should handle text with ( but no )', () => {
    const element = document.createElement('div');
    element.textContent = '(incomplete marking text';

    const result = updateCapcoFromContent(element);

    expect(result).toBeUndefined();
  });

  it('should handle text with ) before (', () => {
    const element = document.createElement('div');
    element.textContent = ') backwards (U) marking';

    const result = updateCapcoFromContent(element);

    expect(result).toBeUndefined();
  });

  it('should trim whitespace after (U) marker removal', () => {
    const element = document.createElement('div');
    element.textContent = '(U)    Multiple spaces after marker';

    const result = updateCapcoFromContent(element);

    expect(result.containsCapco).toBe(true);
    expect(result.updatedTextContent).toBe('Multiple spaces after marker');
  });

  it('should handle (U) at end of text', () => {
    const element = document.createElement('div');
    element.textContent = '(U)';

    const result = updateCapcoFromContent(element);

    expect(result.containsCapco).toBe(true);
    expect(result.updatedTextContent).toBe('');
  });

  it('should handle mixed case capco marking with //', () => {
    const element = document.createElement('div');
    element.textContent = '(sEcReT//NoFoRn) mixed case test';

    const result = updateCapcoFromContent(element);

    expect(result.containsCapco).toBe(true);
    expect(result.capco.portionMarking).toBe('TBD');
  });

  it('should not match (U) in middle of text', () => {
    const element = document.createElement('div');
    element.textContent = 'Some text (U) in middle';

    const result = updateCapcoFromContent(element);

    expect(result).toBeUndefined();
  });

  it('should handle text starting with whitespace before (U)', () => {
    const element = document.createElement('div');
    element.textContent = '  (U) text with leading spaces';

    const result = updateCapcoFromContent(element);

    expect(result.containsCapco).toBe(true);
    expect(result.updatedTextContent).toBe('text with leading spaces');
  });

  it('should handle removeCapcoTextFromNode', () => {
    const node1 = document.createElement('div');
    const node2 = document.createElement('div');
    node2.textContent = '(TBD) test';
    const node3 = document.createElement('div');
    const node4 = document.createElement('div');
    node3.appendChild(node4);
    node1.appendChild(node2);
    node1.appendChild(node3);
    const result = removeCapcoTextFromNode(node1);

    expect(result).toBeUndefined();
  });
});
