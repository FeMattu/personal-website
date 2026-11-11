import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
  // `server-only` throws outside React Server Components; tests run in plain Node.
  'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
}

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    projects: [
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
          // Component tests opt in to jsdom with a `// @vitest-environment jsdom` pragma.
          setupFiles: ['tests/setup.ts'],
          environmentMatchGlobs: [['tests/unit/components/**', 'jsdom']],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.test.ts'],
          globalSetup: ['tests/integration/global-setup.ts'],
          fileParallelism: false,
          testTimeout: 20_000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/actions/**/*.ts'],
      exclude: ['src/lib/db/prisma.ts', 'src/generated/**'],
      reporter: ['text-summary', 'html'],
    },
  },
})
