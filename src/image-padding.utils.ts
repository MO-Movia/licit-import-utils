/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

export interface ImagePadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const MAX_BORDER_PADDING = 8;
const MIN_BORDER_COVERAGE = 0.9;
const WHITE_CHANNEL_THRESHOLD = 248;
const TRANSPARENT_ALPHA_THRESHOLD = 8;

function isWhiteOrTransparent(
  this: void,
  pixels: Uint8ClampedArray,
  offset: number
): boolean {
  return (
    pixels[offset + 3] <= TRANSPARENT_ALPHA_THRESHOLD ||
    (pixels[offset] >= WHITE_CHANNEL_THRESHOLD &&
      pixels[offset + 1] >= WHITE_CHANNEL_THRESHOLD &&
      pixels[offset + 2] >= WHITE_CHANNEL_THRESHOLD)
  );
}

function getPixelOffset(this: void, x: number, y: number, width: number) {
  return (y * width + x) * 4;
}

function getHorizontalBorderCoverage(
  this: void,
  pixels: Uint8ClampedArray,
  width: number,
  y: number,
  minX: number,
  maxX: number
): number {
  let borderPixels = 0;
  for (let x = minX; x <= maxX; x++) {
    if (!isWhiteOrTransparent(pixels, getPixelOffset(x, y, width))) {
      borderPixels++;
    }
  }
  return borderPixels / (maxX - minX + 1);
}

function getVerticalBorderCoverage(
  this: void,
  pixels: Uint8ClampedArray,
  width: number,
  x: number,
  minY: number,
  maxY: number
): number {
  let borderPixels = 0;
  for (let y = minY; y <= maxY; y++) {
    if (!isWhiteOrTransparent(pixels, getPixelOffset(x, y, width))) {
      borderPixels++;
    }
  }
  return borderPixels / (maxY - minY + 1);
}

/**
 * Finds a small white/transparent perimeter outside an image's rectangular
 * border. Requiring a near-continuous border on every side prevents ordinary
 * image whitespace from being cropped.
 */
export function findBorderedImagePadding(
  this: void,
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): ImagePadding | null {
  if (width <= 0 || height <= 0 || pixels.length < width * height * 4) {
    return null;
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isWhiteOrTransparent(pixels, getPixelOffset(x, y, width))) {
        continue;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  const padding = {
    top: minY,
    right: width - 1 - maxX,
    bottom: height - 1 - maxY,
    left: minX,
  };
  const paddingValues = Object.values(padding);
  if (
    paddingValues.every((value) => value === 0) ||
    paddingValues.some((value) => value > MAX_BORDER_PADDING)
  ) {
    return null;
  }

  const borderCoverage = [
    getHorizontalBorderCoverage(pixels, width, minY, minX, maxX),
    getHorizontalBorderCoverage(pixels, width, maxY, minX, maxX),
    getVerticalBorderCoverage(pixels, width, minX, minY, maxY),
    getVerticalBorderCoverage(pixels, width, maxX, minY, maxY),
  ];
  return borderCoverage.every((coverage) => coverage >= MIN_BORDER_COVERAGE)
    ? padding
    : null;
}
