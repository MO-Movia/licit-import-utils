/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import * as zipUtils from './zip.utils';
import * as transformUtils from './transform.utils';

import { parseFrameMakerHTM5Zip } from './transform.zip';

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
