/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import { DocxTransformer } from './transform.docx';

describe('DOCX to HTML Converter', () => {
  let docxTransform!: DocxTransformer;
  beforeEach(() => {
    docxTransform = new DocxTransformer('none', () => undefined);
  });

  it('should transform element with children', () => {
    const element = {
      type: 'example',
      children: [{ type: 'child1' }, { type: 'child2' }],
    };
    const result = docxTransform['transformElement'](element);
    expect(result).toEqual({
      type: 'example',
      children: [{ type: 'child1' }, { type: 'child2' }],
    });
  });

  it('should transform element with unordered numbering for Non Specific', () => {
    docxTransform = new DocxTransformer('Non Specific', () => undefined);
    const element = {
      type: 'example',
      numbering: { isOrdered: false },
      children: [],
    };

    const result = docxTransform['transformElement'](element);

    expect(result.numbering?.symbol).toBe('');
  });

  it('should transform paragraph for non-Non Specific docType', () => {
    docxTransform = new DocxTransformer('LCSP', () => undefined);
    const element = { type: 'paragraph', children: [] };
    const result = docxTransform['transformElement'](element);
    expect(result).toEqual(docxTransform['transSubBullets'](element));
  });

  it('should transform sub-bullets', () => {
    const element = {
      type: 'example',
      children: [
        {
          type: 'run',
          children: [{ type: 'test', value: '✪✪' }],
        },
      ],
      styleId: 'AFDP Bullet',
      styleName: 'AFDP Bullet',
    };

    const result = docxTransform['transSubBullets'](element);

    expect(result.styleId).toBe('AFDP Sub-bullet');
    expect(result.styleName).toBe('AFDP Sub-bullet');
    expect(result.children?.[0]?.children?.[0]?.value).toBe('');
  });

  describe('transformElement', () => {
    it('should transform element with unordered numbering', () => {
      const element = {
        type: 'example',
        numbering: {
          isOrdered: false,
        },
        children: [],
      };
      docxTransform = new DocxTransformer('Non Specific', () => undefined);

      const result = docxTransform['transformElement'](element);

      expect(result).toBeDefined();
    });

    it('should transform element of type "paragraph"', () => {
      const element = {
        type: 'paragraph',
      };
      docxTransform = new DocxTransformer('Non Specific', () => undefined);

      const result = docxTransform['transformElement'](element);

      expect(result).toEqual(docxTransform['transSubBullets'](element));
    });

    it('should not transform element with ordered numbering', () => {
      const element = {
        type: 'example',
        numbering: {
          isOrdered: true,
        },
      };
      docxTransform = new DocxTransformer('Non Specific', () => undefined);

      const result = docxTransform['transformElement'](element);

      expect(result).toEqual(element);
    });

    it('should transform unordered numbering to AFDP Bullet with different docType', () => {
      const element = {
        type: 'example',
        children: [
          {
            type: 'nested',
            children: [{ type: 'leaf' }],
          },
        ],
        numbering: {
          isOrdered: false,
        },
      };

      const result = docxTransform['transformElement'](element);

      expect(result.numbering).toBeNull();
      expect(result.styleId).toBe('AFDP Bullet');
      expect(result.styleName).toBe('AFDP Bullet');
      expect(result.indent).toBeNull();
      expect(result.type).toBe('example');
      expect(result.children).toBeDefined();
      expect(result.children?.length).toBe(1);
    });

    it('should transform to AFDP Sub-bullet with special character child', () => {
      const element = {
        type: 'example',
        children: [
          {
            type: 'nested',
            children: [{ type: 'test', value: '★' }],
          },
        ],
        numbering: {
          isOrdered: false,
        },
      };

      const result = docxTransform['transformElement'](element);

      expect(result.numbering).toBeNull();
      expect(result.styleId).toBe('AFDP Sub-bullet');
      expect(result.styleName).toBe('AFDP Sub-bullet');
      expect(result.children?.length).toBe(0);
    });
  });

  it('should transform element of type "paragraph" 2', () => {
    const element = {
      type: 'paragraph',
    };
    docxTransform = new DocxTransformer('Specific', () => undefined);

    const result = docxTransform['transformElement'](element);

    expect(result).toEqual(docxTransform['transSubBullets'](element));
  });

  it('should transform element with sub-bullets', () => {
    const element = {
      type: 'example',
      numbering: {
        isOrdered: false,
      },
      children: [
        {
          type: 'run',
          children: [
            {
              type: 'text',
              value: '✪✪',
            },
          ],
        },
      ],
      styleId: 'AFDP Bullet',
      styleName: 'AFDP Bullet',
    };

    const result = docxTransform['transSubBullets'](element);

    expect(result.styleId).toBe('Normal');
    expect(result.styleName).toBe('AFDP Sub-bullet');
    expect(result.children?.[0]?.children?.[0]?.value).toBe('');
  });

  it('should not transform element with sub-bullets when ordered numbering', () => {
    const element = {
      type: 'example',
      numbering: {
        isOrdered: true,
      },
      children: [
        {
          type: 'run',
          children: [
            {
              type: 'text',
              value: '✪✪',
            },
          ],
        },
      ],
      styleId: 'AFDP Bullet',
      styleName: 'AFDP Bullet',
    };

    const result = docxTransform['transSubBullets'](element);

    expect(result.styleId).toBe('Normal');
    expect(result.styleName).toBe('AFDP Sub-bullet');
    expect(result.children?.[0]?.children?.[0]?.value).toBe('');
  });

  it('should not transform element without sub-bullets', () => {
    const element = {
      type: 'example',
      numbering: {
        isOrdered: false,
      },
      children: [
        {
          type: 'run',
          children: [
            {
              type: 'text',
              value: 'Some text',
            },
          ],
        },
      ],
      styleId: 'AFDP Bullet',
      styleName: 'AFDP Bullet',
    };

    const result = docxTransform['transSubBullets'](element);

    expect(result.styleId).toBe('AFDP Bullet');
    expect(result.styleName).toBe('AFDP Bullet');
    expect(result.children?.[0]?.children?.[0]?.value).toBe('Some text');
  });

  it('should not transform element with a different styleId', () => {
    const element = {
      type: 'example',
      numbering: {
        isOrdered: false,
      },
      children: [
        {
          type: 'run',
          children: [
            {
              type: 'text',
              value: '✪✪',
            },
          ],
        },
      ],
      styleId: 'OtherStyle',
      styleName: 'OtherStyle',
    };

    const result = docxTransform['transSubBullets'](element);

    expect(result.styleId).toBe('Normal');
    expect(result.styleName).toBe('AFDP Sub-bullet');
    expect(result.children?.[0]?.children?.[0]?.value).toBe('');
  });

  describe('transSubBullets', () => {
    let getElementSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mock getElement to control its behavior
      getElementSpy = jest
        .spyOn(
          docxTransform as unknown as Record<string, (a, b) => void>,
          'getElement'
        )
        .mockImplementation((parent, text) => {
          parent.styleId = 'AFDP Sub-bullet';
          parent.styleName = 'AFDP Sub-bullet';
          text.value = '';
        });
    });

    it('should return element unchanged if no children', () => {
      const element = {
        type: 'paragraph',
        styleId: 'AFDP Bullet',
        styleName: 'AFDP Bullet',
      };

      const result = docxTransform['transSubBullets'](element);

      expect(result).toEqual(element);
      expect(getElementSpy).not.toHaveBeenCalled();
    });

    it('should return element unchanged if no run nodes', () => {
      const element = {
        type: 'paragraph',
        children: [
          { type: 'paragraph', children: [] },
          { type: 'test', value: 'text' },
        ],
        styleId: 'AFDP Bullet',
        styleName: 'AFDP Bullet',
      };

      const result = docxTransform['transSubBullets'](element);

      expect(result).toEqual(element);
      expect(getElementSpy).not.toHaveBeenCalled();
    });

    it('should return element unchanged if run node has no children', () => {
      const element = {
        type: 'paragraph',
        children: [{ type: 'run' }],
        styleId: 'AFDP Bullet',
        styleName: 'AFDP Bullet',
      };

      const result = docxTransform['transSubBullets'](element);

      expect(result).toEqual(element);
      expect(getElementSpy).not.toHaveBeenCalled();
    });

    it('should process run node with TextElement child', () => {
      const element = {
        type: 'paragraph',
        children: [
          {
            type: 'run',
            children: [{ type: 'test', value: '✪' }],
          },
        ],
        styleId: 'AFDP Bullet',
        styleName: 'AFDP Bullet',
      };

      const result = docxTransform['transSubBullets'](element);

      expect(result.styleId).toBe('AFDP Sub-bullet');
      expect(result.styleName).toBe('AFDP Sub-bullet');
      expect(result.children?.[0]?.children?.[0]?.value).toBe('');
      expect(getElementSpy).toHaveBeenCalledTimes(1);
    });

    it('should process multiple run nodes with TextElement children', () => {
      const element = {
        type: 'paragraph',
        children: [
          {
            type: 'run',
            children: [{ type: 'test', value: '✪' }],
          },
          {
            type: 'run',
            children: [{ type: 'test', value: '✪✪' }],
          },
        ],
        styleId: 'AFDP Bullet',
        styleName: 'AFDP Bullet',
      };

      const result = docxTransform['transSubBullets'](element);

      expect(result.styleId).toBe('AFDP Sub-bullet');
      expect(result.styleName).toBe('AFDP Sub-bullet');
      expect(result.children?.[0]?.children?.[0]?.value).toBe('');
      expect(result.children?.[1]?.children?.[0]?.value).toBe('');
      expect(getElementSpy).toHaveBeenCalledTimes(2);
    });

    it('should process only run nodes in mixed children', () => {
      const element = {
        type: 'paragraph',
        children: [
          { type: 'paragraph', children: [] },
          { type: 'test', value: 'ignored' },
          {
            type: 'run',
            children: [{ type: 'test', value: '✪' }],
          },
        ],
        styleId: 'AFDP Bullet',
        styleName: 'AFDP Bullet',
      };

      const result = docxTransform['transSubBullets'](element);

      expect(result.styleId).toBe('AFDP Sub-bullet');
      expect(result.styleName).toBe('AFDP Sub-bullet');
      expect(result.children?.[1]?.value).toBe('ignored'); // Unchanged
      expect(result.children?.[2]?.children?.[0]?.value).toBe('');
      expect(getElementSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('should remove special characters and reset numbering symbol', () => {
    const element = {
      type: 'test',
      children: [
        {
          type: 'test',
          length: 1,
          children: [{ type: 'test', value: 'Some text' }],
        },
      ],
      numbering: {
        isOrdered: false,
        symbol: '1',
      },
    };
    const transformedElement =
      docxTransform['transformNonAFDPBullets'](element);
    expect(transformedElement.children.length).toEqual(1);
    expect(transformedElement.numbering.symbol).toEqual('');
  });
});
