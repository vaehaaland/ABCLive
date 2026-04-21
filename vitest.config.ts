import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    environmentMatchGlobs: [
      ['**/__tests__/actions/**', 'node'],
      ['**/__tests__/festival-report/**', 'node'],
    ],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
