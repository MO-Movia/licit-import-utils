/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import JSZip from 'jszip';

export async function openZip(file: File) {
  const MAX_FILES = 10000;
  const MAX_SIZE = 1073741824; // 1 GB
  if (
    file.size > MAX_SIZE &&
    !confirm(`zip is ${file.size / MAX_SIZE} GB. continue?`)
  ) {
    throw new Error('Size of the file is more than the limit 1GB');
  }

  const zip = await JSZip.loadAsync(file); //NOSONAR zip checked before parsing

  const fileCount = Object.keys(zip.files).length;
  if (
    fileCount > MAX_FILES &&
    !confirm(`zip contains an excessive ${fileCount} files. continue?`)
  ) {
    throw new Error('Total number of files exceeded the limit 10000');
  }
  if (fileCount === 0) {
    throw new Error('No files found in the zip');
  }
  return zip;
}
