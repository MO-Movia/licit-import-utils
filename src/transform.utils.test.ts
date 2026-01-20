/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import { applyImageSize, getImageSizeFromBase64 } from './transform.utils';

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
