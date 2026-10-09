/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import { TextEncoder, TextDecoder } from 'node:util';

// needed to mock this due to execute during loading
document.execCommand = document.execCommand || function execCommandMock() {};
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
globalThis.CSS = {
  supports: () => true,
} as typeof CSS;
