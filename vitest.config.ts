/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    clearMocks: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    reporters: [
      'default',
      ['junit', { outputFile: 'coverage/TESTS.xml' }],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'cobertura', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.d.ts'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    testTimeout: 30000,
  },
});
