import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/index.worker.ts'],
    },
    env: {
      DATABASE_URL: 'file::memory:',
      ANTHROPIC_API_KEY: 'sk-ant-test-placeholder',
      PORT: '3001',
    },
  },
})
