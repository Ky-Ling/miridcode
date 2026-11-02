import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': `${import.meta.dirname}/src` } },
  test: {
    // Business logic only: `.test.tsx` is for hooks that need a real element, never components.
    include: ['src/**/__test__/*.test.ts', 'src/**/__test__/use-*.test.tsx'],
    // `restoreMocks` only restores spies, so `mockReset` clears each `vi.fn()` between tests.
    mockReset: true,
    restoreMocks: true,
  },
})
