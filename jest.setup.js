import { TextEncoder, TextDecoder } from 'node:util';

// needed to mock this due to execute during loading
document.execCommand = document.execCommand || function execCommandMock() {};
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
globalThis.CSS = {
  supports: (a, b) => true,
};
