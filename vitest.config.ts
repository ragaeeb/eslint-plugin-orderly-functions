import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true, // Enable global test functions like 'describe', 'it', etc.
        include: ['src/**/*.test.ts'], // Include pattern for test files
    },
});
