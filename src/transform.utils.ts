/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import type {
  LicitDocumentJSON,
  LicitElementJSON,
  LicitImageAttrsJSON,
  LicitTableJSON,
} from './licit-elements';

//Base 64  Images converted to png for Upload to GUI
export function base64ToFile(
  imgUrl64: string,
  fileName: string | number
): File {
  const base64 = imgUrl64.split(',')[1];
  const byteCharacters = atob(base64);
  const byteNumbers: number[] = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.codePointAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const type = imgUrl64.substring(
    imgUrl64.indexOf(':') + 1,
    imgUrl64.indexOf(';')
  );
  const blob = new Blob([byteArray], { type });
  const name = fileName + '.' + type.substring(type.indexOf('/') + 1);
  const file = new File([blob], name, {
    type,
  });

  return file;
}
export function getImageSizeFromBase64(
  this: void,
  base64: string,
  timeout = 5000
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = base64;
    setInterval(() => reject(new Error('Image load timeout')), timeout);
  });
}

export async function applyImageSizes(this: void, dom: Document | Element) {
  const imgTags = dom.querySelectorAll('img');
  await Promise.all(Array.from(imgTags).map(applyImageSize));
}
export async function applyImageSize(this: void, img: HTMLImageElement) {
  const imgUrl64 = img?.getAttribute('src');
  if (!imgUrl64) {
    return;
  }
  const { width, height } = await getImageSizeFromBase64(imgUrl64);
  const maxWidth = 624;
  let finalWidth = width;
  let finalHeight = height;

  if (finalWidth > maxWidth) {
    const scale = maxWidth / finalWidth;
    finalWidth = maxWidth;
    finalHeight = Math.round(finalHeight * scale);
  }

  img.setAttribute('width', finalWidth.toString());
  img.setAttribute('height', finalHeight.toString());
}

export function removeEmptyParagraphFromJSON(
  this: void,
  json: LicitDocumentJSON
) {
  removeEmptyNodes(json);
  return json;
}

function removeEmptyNodes(
  this: void,
  json: LicitElementJSON
): LicitElementJSON | false {
  if (Array.isArray(json?.content)) {
    json.content = (json.content as LicitElementJSON[])
      .map((item) => removeEmptyNodes(item))
      .filter((x) => x !== false);
  }

  if (json?.type === 'text' && (json?.text as string) === '') {
    return false;
  }

  if (json?.type === 'paragraph') {
    const attrs = json.attrs as { id?: string; styleName?: string } | undefined;

    if (attrs?.id === 'chspace') {
      return json;
    }

    const titleRegex = /(TableTitle|FigureTitle)$/;
    if (attrs?.styleName && titleRegex.exec(attrs.styleName)) {
      return json;
    }

    if (!json.content || (json.content as LicitElementJSON[]).length === 0) {
      return false;
    }

    if (
      (json.content as LicitElementJSON[]).every(
        (item) =>
          item.type === 'text' && (item?.text as string)?.trim?.() === ''
      )
    ) {
      return false;
    }
  }

  return json;
}

export function processAllTableWidths(
  this: void,
  node?:
    | LicitDocumentJSON
    | LicitElementJSON
    | LicitImageAttrsJSON
    | LicitTableJSON
) {
  if (node?.type === 'table') {
    processTableWidths(node);
  }

  if (Array.isArray(node?.content)) {
    node.content.forEach(processAllTableWidths);
  }
}

export function processTableWidths(
  this: void,
  node:
    | LicitDocumentJSON
    | LicitElementJSON
    | LicitImageAttrsJSON
    | LicitTableJSON
) {
  const tableWidths: number[] = [];
  const firstRow = node.content?.[0];
  if (firstRow?.content) {
    for (const cell of firstRow.content) {
      if (Array.isArray(cell.attrs?.colwidth)) {
        tableWidths.push(...cell.attrs.colwidth.map(Number));
      }
    }
    const scaledWidths = scaleWidthArray(tableWidths, 619);
    for (const row of (node as LicitTableJSON).content) {
      for (let i = 0; i < row?.content?.length; i++) {
        const cell = row.content[i];
        if (scaledWidths[i] != null) {
          cell.attrs.colwidth = [scaledWidths[i]];
        }
      }
    }
  }
}

function scaleWidthArray(
  this: void,
  rawWidths: number[],
  target: number
): number[] {
  const total = rawWidths.reduce((sum, w) => sum + w, 0);
  const scaled = rawWidths.map((w) => Math.floor((w / total) * target));
  let diff = target - scaled.reduce((sum, w) => sum + w, 0);

  // Distribute remaining pixels starting from the largest original width
  const indices = rawWidths
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .map((item) => item.index);

  let i = 0;
  while (diff > 0) {
    scaled[indices[i % indices.length]]++;
    diff--;
    i++;
  }

  return scaled;
}
export async function updateImageSrc(
  file: File,
  img: HTMLImageElement,
  updateSrc: (src: File) => Promise<string>,
  fallback: string | Promise<string>
) {
  const readerPromise = updateSrc(file)
    .catch((error) => {
      console.error('Error uploading image:', error);
      return fallback;
    })
    .then((src) => {
      // Update the image node's src property with the new source
      // (New source will be URL from GUI)
      img.src = src;
      img.setAttribute('srcRelative', src); // This is needed for the image inside table to work
    });

  return readerPromise;
}

export async function updateSource(
  this: void,
  img: HTMLImageElement,
  name: string | number,
  updateSrc: (src: File) => Promise<string>
): Promise<void> {
  try {
    await applyImageSize(img);
  } catch (err) {
    console.warn('Could not extract image size', err);
  }
  const imgUrl64 = img?.getAttribute('src');
  if (imgUrl64) {
    // Convert to File and upload/update src
    const file = base64ToFile(imgUrl64, name);
    await updateImageSrc(file, img, (f) => updateSrc(f), imgUrl64);
  }
}
