/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import type JSZip from 'jszip';
import { openZip } from './zip.utils';
import { updateImageSrc } from './transform.utils';

interface HTMLFile {
  name: string;
  content: () => Promise<string>;
}

interface HTMLContent {
  files: HTMLFile[];
  imageFiles: ImjObj[];
}

interface ImjObj {
  name: string;
  fallback: Promise<string>;
  file: Promise<File>;
}

export async function parseFrameMakerHTM5Zip(
  this: void,
  file: File,
  updateSrc: (src: File) => Promise<string>
): Promise<Element[]> {
  if (!file) {
    throw new Error('No file provided for parsing.');
  }
  return loopHTMLFiles(await extractFiles(file), updateSrc);
}

//A method for extracting zip file and for getting the correct order of files from the toc file if any
async function extractFiles(this: void, file: File): Promise<HTMLContent> {
  let tocFiles: string[] = [];
  const zip = await openZip(file);
  //Checking if toc.js is present
  let tocFile: JSZip.JSZipObject[] = zip.file(/toc\.js$/gm);
  if (zip.files && tocFile.length === 1) {
    tocFiles = await getTocArray(tocFile[0], zip);
  } else {
    //Checking if toc.htm is present
    tocFile = zip.file(/toc\.htm$/gim);
    if (tocFile.length == 1) {
      tocFiles = await getTocHtmArray(tocFile[0]);
    }
  }
  const fileNames = Object.keys(zip.files);
  const content = filterFiles(zip.files, fileNames, tocFiles);

  if (!content?.files?.length) {
    throw new Error('No HTM files found in the ZIP archive.');
  }
  return content;
}

function filterFiles(
  this: void,
  zip: Record<string, JSZip.JSZipObject>,
  fileNames: string[],
  tocFiles: string[]
): HTMLContent {
  let htmlArray: JSZip.JSZipObject[] = [];
  const imageFiles: ImjObj[] = [];
  const regex = /\.(jpeg|jpg|gif|png)$/;
  for (const fileName of fileNames) {
    const match = regex.exec(fileName);
    if (match) {
      const blobp = zip[fileName].async('blob');
      imageFiles.push({
        name: fileName,
        fallback: blobp.then((b) => blobToBase64(b)),
        file: blobp.then(
          (blob) => new File([blob], fileName, { type: 'Image/' + match[1] })
        ),
      });
    }

    if (fileName.endsWith('.htm')) {
      htmlArray.push(zip[fileName]);
    }
  }

  //If tocFile is available then filter and sort the html array as per the toc else send it as such
  if (tocFiles.length !== 0) {
    //Replacing htmlArray with the filtered and sorted array
    htmlArray = tocFiles
      .map((fileName) =>
        htmlArray.find((htmlFile) =>
          htmlFile.name.endsWith(fileName.split('/').pop() ?? '.')
        )
      )
      .filter((x) => !!x);
  }
  return {
    files: htmlArray.map((file) => ({
      name: file.name,
      content: () => file.async('string'),
    })),
    imageFiles: imageFiles,
  };
}

function blobToBase64(this: void, blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function getTocArray(
  this: void,
  tocFile: JSZip.JSZipObject,
  zipFiles: JSZip
) {
  const htmUrlsWithOffsets: string[] = [];
  const tocContent = await tocFile.async('string');
  const startIndx = tocContent.indexOf('<?xml');
  const endIndx = tocContent.length - 2;
  const xmlStr = tocContent.substring(startIndx, endIndx);
  const xmlString = xmlStr.split('\\').join('');
  let currentIndex = 0;
  while (currentIndex < xmlString.length) {
    const urlIndex = xmlString.indexOf('url="', currentIndex);
    if (urlIndex === -1) {
      break; // No more "url=" attributes
    }
    const startOfUrl = urlIndex + 5; // Length of 'url="'
    const endOfUrl = xmlString.indexOf('"', startOfUrl);
    if (endOfUrl === -1) {
      break;
    }
    const url = xmlString.substring(startOfUrl, endOfUrl);
    //Check if the URL is an .htm file
    if (url.includes('.htm')) {
      htmUrlsWithOffsets.push(url);
    }
    currentIndex = endOfUrl + 1;
  }

  const htmUrlsWithoutOffsets: string[] = htmUrlsWithOffsets.map((url) => {
    return url.split('#')[0];
  });
  let uniqueHtmUrls: string[] = [];
  let previousUrl = '';
  for (const url of htmUrlsWithoutOffsets) {
    if (url !== previousUrl) {
      uniqueHtmUrls.push(url);
      previousUrl = url;
    }
  }
  if (uniqueHtmUrls.length > 0) {
    const firstUrlSegment = uniqueHtmUrls[0].split('/')[0];
    const parentDirectory = Object.keys(zipFiles.files)[0].split('/')[0];
    if (firstUrlSegment != parentDirectory) {
      uniqueHtmUrls = uniqueHtmUrls.map((url) => parentDirectory + '/' + url);
    }
  }
  return uniqueHtmUrls;
}
async function getTocHtmArray(this: void, tocHtmFile: JSZip.JSZipObject) {
  const htmlContent = await tocHtmFile.async('string');
  const domCollection = new DOMParser().parseFromString(
    htmlContent,
    'text/html'
  );
  const chTextTOCElements = Array.from(
    domCollection.getElementsByClassName('chTextTOC')
  );
  const attTextTOCElements = Array.from(
    domCollection.getElementsByClassName('attTextTOC')
  );
  const tocNodeList = [...chTextTOCElements, ...attTextTOCElements];
  return getHrefValues(tocNodeList);
}

function getHrefValues(tocNodes: Element[]) {
  const hrefArray: string[] = [];
  for (const element of tocNodes) {
    const anchorTags = element.querySelectorAll('a');
    for (const anchorTag of Array.from(anchorTags)) {
      const href = anchorTag.href;
      if (href) {
        const lastSlashIndex = href.lastIndexOf('/');
        let extractedHref = decodeURIComponent(href.slice(lastSlashIndex + 1));
        const hashIndex = extractedHref.indexOf('#');
        if (hashIndex !== -1) {
          extractedHref = extractedHref.slice(0, hashIndex);
        }
        // Remove '_NEWC' from the file name
        if (extractedHref.endsWith('_NEWC.htm')) {
          extractedHref = extractedHref.replace('_NEWC.htm', '.htm');
        }
        hrefArray.push(extractedHref);
      }
    }
  }
  return hrefArray;
}

async function loopHTMLFiles(
  this: void,
  htmlFiles: HTMLContent,
  updateSrc: (src: File) => Promise<string>
): Promise<Element[]> {
  const processedHtmlContents: Element[][] = (
    await Promise.all(
      htmlFiles.files
        .filter((htmlFile) => !!htmlFile)
        .map((f) => processFile(f, htmlFiles.imageFiles, updateSrc))
    )
  ).filter((x) => x?.length);
  return sortedNodeList(processedHtmlContents);
}

async function processFile(
  file: HTMLFile,
  imageFiles: ImjObj[],
  updateSrc: (src: File) => Promise<string>
): Promise<Element[]> {
  const htmlContent = await file.content();
  const htmlFileName = file.name ?? 'Unknown file';
  // Get content before <head> (first 1000 chars should be enough)
  const beforeHead = htmlContent.substring(0, 1000);
  // Check 1: Reject old DOCTYPE declarations
  if (beforeHead.includes('<!DOCTYPE HTML PUBLIC')) {
    throw new Error(`Incorrect file format: ${htmlFileName}`);
  }

  // Check 2: Reject XML declarations (XHTML format)
  if (beforeHead.trimStart().startsWith('<?xml')) {
    throw new Error(`Incorrect file format: ${htmlFileName}`);
  }

  // Check 3: Must have <html lang="...">
  // Option A: Exact match for en-US
  if (!beforeHead.includes('<html lang="en-US">')) {
    throw new Error(`Incorrect file format: ${htmlFileName}`);
  }
  const domCollection = new DOMParser().parseFromString(
    htmlContent,
    'text/html'
  );
  //Get the title text
  const titleElement = domCollection.querySelector('title');
  const titleText = titleElement?.textContent?.trim();
  //Get the chapterTitle element and text
  const chapterTitleElement = domCollection.querySelector('.chapterTitle');
  const chapterText = chapterTitleElement?.textContent;
  // If title exists and chapterTitle is empty
  if (
    titleText &&
    chapterTitleElement &&
    !chapterText?.replaceAll('&nbsp;', '').trim()
  ) {
    chapterTitleElement.textContent = titleText;
  }
  const imgTags = Array.from(domCollection.querySelectorAll('img'));
  await processImages(imgTags, imageFiles, updateSrc);

  const nodes = domCollection.querySelectorAll('body > *');
  const nodeArray = Array.from(nodes).filter(
    (node) => !(node instanceof HTMLScriptElement)
  );
  return nodeArray;
}

// Fix for file order
function sortedNodeList(this: void, processedHtmlContents: Element[][]) {
  let nodeListArray: Element[] = [];
  processedHtmlContents ??= [];
  for (const element of processedHtmlContents) {
    if (element) {
      nodeListArray = nodeListArray.concat(element);
    }
  }
  return nodeListArray;
}

async function processImages(
  this: void,
  imgArray: HTMLImageElement[],
  imageFiles: ImjObj[],
  updateSrc: (src: File) => Promise<string>
) {
  for (const img of imgArray) {
    const imgUrl = img.getAttribute('src');
    const parts = imgUrl?.split('/');
    if (!parts?.length) {
      continue;
    }

    const targetFileName = parts.at(-1);
    const file = imageFiles.find(
      (f) => extractFileName(f.name) === targetFileName
    );

    if (file) {
      try {
        const f = await file.file; // Wait for file resolution

        await updateImageSize(f, targetFileName, img);

        await updateImageSrc(f, img, updateSrc, file.fallback);
      } catch (error) {
        console.error(`Error processing ${targetFileName}:`, error);
      }
    } else {
      const errorMessage = `${targetFileName} missing from doc`;
      console.warn(errorMessage);

      img.src = '';
      img.alt = `WARNING! File ${targetFileName} was missing during import!`;
    }
  }
}

function extractFileName(this: void, fullPath: string): string | undefined {
  return fullPath.split('/').pop();
}

async function updateImageSize(
  this: void,
  f: File,
  targetFileName: string | undefined,
  img: HTMLImageElement
) {
  let aspectRatio: number | undefined;
  try {
    aspectRatio = await getImageAspectRatio(f);
  } catch (e) {
    console.warn(`Could not determine aspect ratio for ${targetFileName}`, e);
  }

  let width: number | undefined;
  let height: number | undefined;

  // Prefer explicit attributes if present
  const widthAttr = img.style.getPropertyValue('width');
  const heightAttr = img.style.getPropertyValue('height');

  if (widthAttr) {
    width = Number.parseFloat(widthAttr);
  } else if (img.width) {
    width = img.width;
  }

  if (heightAttr) {
    height = Number.parseFloat(heightAttr);
  } else if (img.height) {
    height = img.height;
  }

  if (aspectRatio && width && !height) {
    height = width / aspectRatio;
  } else if (aspectRatio && height && !width) {
    width = height * aspectRatio;
  }
  if (width) {
    width = Math.round(width);
    img.width = width;
    img.style.setProperty('width', String(width));
  }
  if (height) {
    height = Math.round(height);
    img.height = height;
    img.style.setProperty('height', String(height));
  }
}

async function getImageAspectRatio(this: void, file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const aspectRatio = img.width / img.height;
      URL.revokeObjectURL(url);
      resolve(aspectRatio);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(
        new Error('Failed to load image for aspect ratio calculation', {
          cause: err,
        })
      );
    };

    img.src = url;
  });
}
