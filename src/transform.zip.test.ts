/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import * as zipUtils from './zip.utils';
import * as transformUtils from './transform.utils';
import JSZip from 'jszip';

import { parseFrameMakerHTM5Zip } from './transform.zip';
const actualZipUtils = jest.requireActual<typeof import('./zip.utils')>(
  './zip.utils'
);

jest.mock('./zip.utils');
jest.mock('./transform.utils');

describe('transform.zip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseFrameMakerHTM5Zip', () => {
    it('should throw error when no file is provided', async () => {
      const updateSrc = jest.fn();
      await expect(parseFrameMakerHTM5Zip(null!, updateSrc)).rejects.toThrow(
        'No file provided for parsing.'
      );
    });

    it('should throw error when no HTM files found in ZIP', async () => {
      const mockFile = new File([''], 'test.zip', { type: 'application/zip' });
      const mockZip = {
        files: {},
        file: jest.fn().mockReturnValue([]),
      };
      (zipUtils.openZip as jest.Mock).mockResolvedValue(mockZip);

      const updateSrc = jest.fn();
      await expect(parseFrameMakerHTM5Zip(mockFile, updateSrc)).rejects.toThrow(
        'No HTM files found in the ZIP archive.'
      );
    });

    it('should fail with empty HTM files', async () => {
      const mockFile = new File([''], 'test.zip', { type: 'application/zip' });
      const mockZip = {
        files: {
          'test.htm': {
            name: 'test.htm',
            async: jest.fn().mockResolvedValue(''),
          },
        },
        file: jest.fn().mockReturnValue([]),
      };
      (zipUtils.openZip as jest.Mock).mockResolvedValue(mockZip);
      (transformUtils.updateImageSrc as jest.Mock).mockResolvedValue('');

      const updateSrc = jest.fn().mockResolvedValue('data:image/png;base64,');
      await expect(
        parseFrameMakerHTM5Zip(mockFile, updateSrc)
      ).rejects.toBeInstanceOf(Error);
    });

    it('should fail with contentless HTM files', async () => {
      const mockFile = new File([''], 'test.zip', { type: 'application/zip' });
      const mockZip = {
        files: {
          'test.htm': {
            name: 'test.htm',
            async: jest
              .fn()
              .mockResolvedValue(
                '<html lang="en-US"><head><title>Test</title></head><body></body></html>'
              ),
          },
        },
        file: jest.fn().mockReturnValue([]),
      };
      (zipUtils.openZip as jest.Mock).mockResolvedValue(mockZip);
      (transformUtils.updateImageSrc as jest.Mock).mockResolvedValue('');

      const updateSrc = jest.fn().mockResolvedValue('data:image/png;base64,');
      await expect(
        parseFrameMakerHTM5Zip(mockFile, updateSrc)
      ).rejects.toBeInstanceOf(Error);
    });

    it('should process HTM files successfully', async () => {
      const mockFile = new File([''], 'test.zip', { type: 'application/zip' });
      const mockZip = {
        files: {
          'test.htm': {
            name: 'test.htm',
            async: jest
              .fn()
              .mockResolvedValue(
                '<html lang="en-US"><head><title>Test</title></head><body><span>test</span></body></html>'
              ),
          },
        },
        file: jest.fn().mockReturnValue([]),
      };
      (zipUtils.openZip as jest.Mock).mockResolvedValue(mockZip);
      (transformUtils.updateImageSrc as jest.Mock).mockResolvedValue('');

      const updateSrc = jest.fn().mockResolvedValue('data:image/png;base64,');
      const result = await parseFrameMakerHTM5Zip(mockFile, updateSrc);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle files with toc.js', async () => {
      const mockFile = new File([''], 'test.zip', {
        type: 'application/zip',
      });
      const tocContent =
        '<?xml version="1.0"?><toc><item url="chapter1.htm"></item></toc>';
      const mockZip = {
        files: {
          'toc.js': {
            name: 'toc.js',
            async: jest.fn().mockResolvedValue(tocContent),
          },
          'chapter1.htm': {
            name: 'chapter1.htm',
            async: jest
              .fn()
              .mockResolvedValue(
                '<html lang="en-US"><head><title>Ch1</title></head><body><span>test</span></body></html>'
              ),
          },
        },
        file: jest
          .fn()
          .mockReturnValueOnce([
            { name: 'toc.js', async: jest.fn().mockResolvedValue(tocContent) },
          ])
          .mockReturnValueOnce([]),
      };
      (zipUtils.openZip as jest.Mock).mockResolvedValue(mockZip);

      const updateSrc = jest.fn().mockResolvedValue('');
      const result = await parseFrameMakerHTM5Zip(mockFile, updateSrc);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  it('blobToBase64 should convert blob to base64 string', async () => {
    const blob = new Blob(['test'], { type: 'text/plain' });
    const result = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    expect(result).toContain('data:text/plain;base64');
  });

  it('extractFileName should extract file name from full path', () => {
    const fullPath = 'path/to/image.jpg';
    const fileName = fullPath.split('/').pop();
    expect(fileName).toBe('image.jpg');
  });
});

describe('transform.zip coverage additions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses toc.htm ordering and normalizes _NEWC links', async () => {
    const tocHtm = `
      <div class="chTextTOC"><a href="https://x/Chapter%201_NEWC.htm#s">c1</a></div>
      <div class="attTextTOC"><a href="https://x/appendix.htm">app</a></div>
    `;

    const zip = {
      files: {
        'toc.htm': { name: 'toc.htm', async: jest.fn().mockResolvedValue(tocHtm) },
        'appendix.htm': {
          name: 'appendix.htm',
          async: jest
            .fn()
            .mockResolvedValue('<html lang="en-US"><head><title>A</title></head><body><p id="a">A</p></body></html>'),
        },
        'Chapter 1.htm': {
          name: 'Chapter 1.htm',
          async: jest
            .fn()
            .mockResolvedValue('<html lang="en-US"><head><title>C</title></head><body><p id="c">C</p></body></html>'),
        },
      },
      file: jest
        .fn()
        .mockReturnValueOnce([])
        .mockReturnValueOnce([{ async: jest.fn().mockResolvedValue(tocHtm) }]),
    };

    (zipUtils.openZip as jest.Mock).mockResolvedValue(zip);

    const result = await parseFrameMakerHTM5Zip(
      new File(['x'], 'a.zip'),
      () => Promise.resolve('x')
    );
    expect(result).toHaveLength(2);
    expect((result[0] as HTMLElement).id).toBe('c');
    expect((result[1] as HTMLElement).id).toBe('a');
  });

  it('uses toc.js and prefixes parent directory when needed', async () => {
    const tocJs =
      '<?xml version="1.0"?><toc><item url="chapter.htm#x"></item><item url="chapter.htm#y"></item></toc>';

    const zip = {
      files: {
        'book/toc.js': {
          name: 'book/toc.js',
          async: jest.fn().mockResolvedValue(tocJs),
        },
        'book/chapter.htm': {
          name: 'book/chapter.htm',
          async: jest
            .fn()
            .mockResolvedValue('<html lang="en-US"><head><title>T</title></head><body><p id="ok">OK</p></body></html>'),
        },
      },
      file: jest
        .fn()
        .mockReturnValueOnce([{ async: jest.fn().mockResolvedValue(tocJs) }]),
    };

    (zipUtils.openZip as jest.Mock).mockResolvedValue(zip);

    const result = await parseFrameMakerHTM5Zip(
      new File(['x'], 'b.zip'),
      () => Promise.resolve('x')
    );
    expect(result).toHaveLength(1);
    expect((result[0] as HTMLElement).id).toBe('ok');
  });

  it('rejects old HTML PUBLIC doctype', async () => {
    const zip = {
      files: {
        'doc.htm': {
          name: 'doc.htm',
          async: jest
            .fn()
            .mockResolvedValue('<!DOCTYPE HTML PUBLIC "old"><html lang="en-US"><body><p>x</p></body></html>'),
        },
      },
      file: jest.fn().mockReturnValue([]),
    };

    (zipUtils.openZip as jest.Mock).mockResolvedValue(zip);

    await expect(
      parseFrameMakerHTM5Zip(new File(['x'], 'c.zip'), () => Promise.resolve('x'))
    ).rejects.toThrow('!DOCTYPE HTML PUBLIC');
  });

  it('rejects XHTML style xml declaration', async () => {
    const zip = {
      files: {
        'doc.htm': {
          name: 'doc.htm',
          async: jest
            .fn()
            .mockResolvedValue('<?xml version="1.0"?><html lang="en-US"><body><p>x</p></body></html>'),
        },
      },
      file: jest.fn().mockReturnValue([]),
    };

    (zipUtils.openZip as jest.Mock).mockResolvedValue(zip);

    await expect(
      parseFrameMakerHTM5Zip(new File(['x'], 'd.zip'), () => Promise.resolve('x'))
    ).rejects.toThrow('Incorrect file format (was "XHTML")');
  });

  it('rejects html that does not include en-US lang', async () => {
    const zip = {
      files: {
        'doc.htm': {
          name: 'doc.htm',
          async: jest
            .fn()
            .mockResolvedValue('<html><head><title>x</title></head><body><p>x</p></body></html>'),
        },
      },
      file: jest.fn().mockReturnValue([]),
    };

    (zipUtils.openZip as jest.Mock).mockResolvedValue(zip);

    await expect(
      parseFrameMakerHTM5Zip(new File(['x'], 'e.zip'), () => Promise.resolve('x'))
    ).rejects.toThrow('missing "<html lang=..."');
  });

  it('fills chapterTitle from title, strips scripts, and handles missing image references', async () => {
    const html =
      '<html lang="en-US"><head><title>Chapter Name</title></head><body><div class="chapterTitle">&nbsp;</div><script>bad()</script><img src="images/missing.png" /><p id="kept">ok</p></body></html>';

    const zip = {
      files: {
        'doc.htm': {
          name: 'doc.htm',
          async: jest.fn().mockResolvedValue(html),
        },
      },
      file: jest.fn().mockReturnValue([]),
    };

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    (zipUtils.openZip as jest.Mock).mockResolvedValue(zip);

    const result = await parseFrameMakerHTM5Zip(
      new File(['x'], 'f.zip'),
      () => Promise.resolve('x')
    );

    const chapterTitle = result.find((node) =>
      (node as HTMLElement).classList?.contains('chapterTitle')
    ) as HTMLElement;
    const img = result.find((node) => node.tagName === 'IMG') as HTMLImageElement;

    expect(chapterTitle.textContent).toBe('Chapter Name');
    expect(result.some((node) => node.tagName === 'SCRIPT')).toBe(false);
    expect(img.alt).toContain('missing during import');
    expect(img.getAttribute('src')).toBe('');
    expect(warnSpy).toHaveBeenCalledWith('missing.png missing from doc');
  });

  it('processes matching image files and logs upload errors from updateImageSrc', async () => {
    const html =
      '<html lang="en-US"><head><title>Imgs</title></head><body><img src="images/pic.png" style="width: 200px;" /><img /></body></html>';
    const blob = new Blob(['img'], { type: 'image/png' });

    const zip = {
      files: {
        'doc.htm': {
          name: 'doc.htm',
          async: jest.fn().mockResolvedValue(html),
        },
        'images/pic.png': {
          name: 'images/pic.png',
          async: jest.fn().mockResolvedValue(blob),
        },
      },
      file: jest.fn().mockReturnValue([]),
    };

    Object.defineProperty(URL, 'createObjectURL', {
      value: jest.fn(() => 'blob://x'),
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: jest.fn(),
      configurable: true,
    });

    jest.spyOn(globalThis, 'Image').mockImplementation(() => {
      let onloadHandler: null | ((value: unknown) => void) = null;
      let onerrorHandler: null | ((value: unknown) => void) = null;
      const image = {
        width: 100,
        height: 50,
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

    (transformUtils.updateImageSrc as jest.Mock).mockRejectedValueOnce(
      new Error('upload failed')
    );

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (zipUtils.openZip as jest.Mock).mockResolvedValue(zip);

    const result = await parseFrameMakerHTM5Zip(
      new File(['x'], 'g.zip'),
      () => Promise.resolve('x')
    );
    const img = result.find((node) => node.tagName === 'IMG') as HTMLImageElement;

    expect((URL.createObjectURL as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    expect((URL.revokeObjectURL as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    expect(img.width).toBe(200);
    expect(img.height).toBe(100);
    expect((transformUtils.updateImageSrc as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    expect(errorSpy).toHaveBeenCalledWith('Error processing pic.png:', expect.any(Error));
  });
});

describe('openZip coverage additions merged', () => {
  let loadAsyncSpy: jest.SpiedFunction<typeof JSZip.loadAsync>;
  let confirmSpy: jest.SpiedFunction<typeof globalThis.confirm>;

  beforeEach(() => {
    jest.clearAllMocks();
    loadAsyncSpy = jest.spyOn(JSZip, 'loadAsync');
    confirmSpy = jest.spyOn(globalThis, 'confirm').mockReturnValue(true);
  });

  it('throws when file size is above 1GB and user declines', async () => {
    confirmSpy.mockReturnValue(false);

    const hugeFile = new File(['x'], 'huge.zip');
    Object.defineProperty(hugeFile, 'size', { value: 1073741825 });

    await expect(actualZipUtils.openZip(hugeFile)).rejects.toThrow(
      'Size of the file is more than the limit 1GB'
    );
    expect(loadAsyncSpy).not.toHaveBeenCalled();
  });

  it('throws when zip has too many files and user declines', async () => {
    confirmSpy.mockReturnValue(false);
    const files = Object.fromEntries(
      Array.from({ length: 10001 }, (_, i) => [`${i}.htm`, {}])
    );
    loadAsyncSpy.mockResolvedValue({ files } as never);

    await expect(actualZipUtils.openZip(new File(['x'], 'many.zip'))).rejects.toThrow(
      'Total number of files exceeded the limit 10000'
    );
  });

  it('throws when zip has no files', async () => {
    loadAsyncSpy.mockResolvedValue({ files: {} } as never);

    await expect(actualZipUtils.openZip(new File(['x'], 'empty.zip'))).rejects.toThrow(
      'No files found in the zip'
    );
  });

  it('returns parsed zip for valid file', async () => {
    const zip = { files: { 'one.htm': {} } };
    loadAsyncSpy.mockResolvedValue(zip as never);

    await expect(actualZipUtils.openZip(new File(['x'], 'ok.zip'))).resolves.toBe(zip);
  });
});

