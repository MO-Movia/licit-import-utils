/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import { applyImageSize, getImageSizeFromBase64 } from './transform.utils';
import * as transformUtils from './transform.utils';

describe('getImageSizeFromBase64', () => {
  it('should resolve with width and height for valid base64 image', async () => {
    const base64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const mockImg = {
      width: 1,
      height: 1,
    } as HTMLImageElement;
    jest.spyOn(globalThis, 'Image').mockReturnValue(mockImg);
    const p = getImageSizeFromBase64(base64, 1);
    mockImg.onload(null!); // Simulate image load
    const result = await p;
    expect(result).toHaveProperty('width');
    expect(result).toHaveProperty('height');
    expect(typeof result.width).toBe('number');
    expect(typeof result.height).toBe('number');
  });

  it('should reject for invalid base64 string', async () => {
    const invalidBase64 = 'data:image/png;base64,invalid';
    await expect(getImageSizeFromBase64(invalidBase64, 1)).rejects.toThrow();
  });

  it('should reject for empty base64 string', async () => {
    await expect(getImageSizeFromBase64('', 1)).rejects.toThrow();
  });

  it('should handle malformed data URL', async () => {
    await expect(getImageSizeFromBase64('not-a-data-url', 1)).rejects.toThrow();
  });

  it('should handle empty applyImageSize', async () => {
    await expect(
      applyImageSize(document.createElement('img'))
    ).resolves.toBeUndefined();
  });
});

describe('transform.utils coverage additions', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('base64ToFile converts base64 image to File', () => {
    const data = 'data:image/png;base64,QUJD';
    const file = transformUtils.base64ToFile(data, 'sample');

    expect(file.name).toBe('sample.png');
    expect(file.type).toBe('image/png');
  });

  it('applyImageSizes applies width and height attributes to all img tags', async () => {
    jest.spyOn(globalThis, 'Image').mockImplementation(() => {
      let onloadHandler: null | ((value: unknown) => void) = null;
      let onerrorHandler: null | ((value: unknown) => void) = null;
      const image = {
        width: 1200,
        height: 600,
        set src(_value: string) {
          setTimeout(() => onloadHandler?.(null), 0);
        },
        get onload() {
          return onloadHandler;
        },
        set onload(handler: null | ((value: unknown) => void)) {
          onloadHandler = handler;
        },
        get onerror() {
          return onerrorHandler;
        },
        set onerror(handler: null | ((value: unknown) => void)) {
          onerrorHandler = handler;
        },
      };
      return image as unknown as HTMLImageElement;
    });

    const dom = new DOMParser().parseFromString(
      '<div><img src="data:image/png;base64,QUJD" /><img src="data:image/png;base64,QUJD" /></div>',
      'text/html'
    );

    await transformUtils.applyImageSizes(dom);
    const imgs = dom.querySelectorAll('img');
    expect(imgs[0].getAttribute('width')).toBe('624');
    expect(imgs[0].getAttribute('height')).toBe('312');
    expect(imgs[1].getAttribute('width')).toBe('624');
  });

  it('removeEmptyParagraphFromJSON drops empty text/paragraph nodes and keeps allowed paragraph styles', () => {
    const json = {
      type: 'doc',
      content: [
        { type: 'text', text: '' },
        { type: 'paragraph', attrs: { id: 'chspace' }, content: [] },
        { type: 'paragraph', attrs: { styleName: 'TableTitle' }, content: [] },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '   ' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'kept' }],
        },
      ],
    };

    const result = transformUtils.removeEmptyParagraphFromJSON(json as never);
    const content = result.content as Array<Record<string, unknown>>;

    expect(content).toHaveLength(3);
    expect((content[0].attrs as { id?: string }).id).toBe('chspace');
    expect((content[1].attrs as { styleName?: string }).styleName).toBe('TableTitle');
    expect(((content[2].content as Array<Record<string, unknown>>)[0].text as string)).toBe(
      'kept'
    );
  });

  it('processTableWidths scales first-row widths and applies to all rows', () => {
    const table = {
      type: 'table',
      content: [
        {
          content: [
            { attrs: { colwidth: [100] } },
            { attrs: { colwidth: [200] } },
          ],
        },
        {
          content: [
            { attrs: { colwidth: [1] } },
            { attrs: { colwidth: [1] } },
          ],
        },
      ],
    };

    transformUtils.processTableWidths(table as never);

    const first = table.content[0].content.map((cell) => cell.attrs.colwidth[0]);
    const second = table.content[1].content.map((cell) => cell.attrs.colwidth[0]);

    expect(first[0] + first[1]).toBe(619);
    expect(second).toEqual(first);
  });

  it('processAllTableWidths walks nested content and updates nested table widths', () => {
    const nestedTable = {
      type: 'table',
      content: [
        {
          content: [
            { attrs: { colwidth: [50] } },
            { attrs: { colwidth: [50] } },
          ],
        },
      ],
    };

    const json = {
      type: 'doc',
      content: [{ type: 'section', content: [nestedTable] }],
    };

    transformUtils.processAllTableWidths(json as never);
    expect(nestedTable.content[0].content[0].attrs.colwidth[0]).toBeGreaterThan(0);
    expect(nestedTable.content[0].content[1].attrs.colwidth[0]).toBeGreaterThan(0);
  });

  it('updateImageSrc uses fallback and sets src/srcRelative when upload fails', async () => {
    const img = document.createElement('img');
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await transformUtils.updateImageSrc(
      new File(['x'], 'a.png', { type: 'image/png' }),
      img,
      () => Promise.reject(new Error('upload-failed')),
      Promise.resolve('fallback-src')
    );

    expect(errorSpy).toHaveBeenCalled();
    expect(img.src).toContain('fallback-src');
    expect(img.getAttribute('srcRelative')).toBe('fallback-src');
  });

  it('updateSource warns on image-size extraction failure and still uploads', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const img = document.createElement('img');

    img.setAttribute('src', 'data:image/png;base64,QUJD');

    let onloadHandler: null | ((value: unknown) => void) = null;
    let onerrorHandler: null | ((value: unknown) => void) = null;
    const mockImage = {
      set src(_value: string) {
        setTimeout(() => onerrorHandler?.(new Error('bad-image')), 0);
      },
      get onload() {
        return onloadHandler;
      },
      set onload(handler: null | ((value: unknown) => void)) {
        onloadHandler = handler;
      },
      get onerror() {
        return onerrorHandler;
      },
      set onerror(handler: null | ((value: unknown) => void)) {
        onerrorHandler = handler;
      },
      width: 0,
      height: 0,
    };
    jest
      .spyOn(globalThis, 'Image')
      .mockImplementation(() => mockImage as unknown as HTMLImageElement);

    const updateSrc = jest.fn().mockResolvedValue('https://example.com/new.png');
    await transformUtils.updateSource(img, 'img-1', updateSrc);

    expect(warnSpy).toHaveBeenCalledWith(
      'Could not extract image size',
      expect.any(Error)
    );
    expect(updateSrc).toHaveBeenCalledTimes(1);
    expect(img.getAttribute('srcRelative')).toBe('https://example.com/new.png');
  });

  it('applyImageSize does not scale if width <= maxWidth', async () => {
    const img = document.createElement('img');
    img.setAttribute('src', 'data:image/png;base64,QUJD');

    let onloadHandler: null | ((value: unknown) => void) = null;
    const mockImage = {
      width: 300,
      height: 200,
      set src(_value: string) {
        setTimeout(() => onloadHandler?.(null), 0);
      },
      get onload() {
        return onloadHandler;
      },
      set onload(handler: null | ((value: unknown) => void)) {
        onloadHandler = handler;
      },
    };
    jest
      .spyOn(globalThis, 'Image')
      .mockImplementation(() => mockImage as unknown as HTMLImageElement);

    await transformUtils.applyImageSize(img);

    expect(img.getAttribute('width')).toBe('300');
    expect(img.getAttribute('height')).toBe('200');
  });

  it('processTableWidths handles table with no first row content', () => {
    const table = {
      type: 'table',
      content: [
        {
          content: [],
        },
      ],
    };

    transformUtils.processTableWidths(table);

    // Should not throw, and content remains unchanged
    expect(table.content[0].content).toEqual([]);
  });

  it('updateSource does nothing if img has no src', async () => {
    const img = document.createElement('img');
    const updateSrc = jest.fn();

    await transformUtils.updateSource(img, 'img-1', updateSrc);

    expect(updateSrc).not.toHaveBeenCalled();
  });

  it('getImageSizeFromBase64 times out if image does not load', async () => {
    const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const mockImg = {
      width: 1,
      height: 1,
    } as HTMLImageElement;
    jest.spyOn(globalThis, 'Image').mockReturnValue(mockImg);
    // Don't call onload, so it times out

    await expect(getImageSizeFromBase64(base64, 1)).rejects.toThrow('Image load timeout');
  });
});

