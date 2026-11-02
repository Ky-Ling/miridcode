import { describe, expect, it, vi } from 'vitest'

import { uniq } from '@/lib/utils'

import { COMMANDS } from '../constants'

describe('COMMANDS', () => {
  it('gives every command a unique name', () => {
    const names = COMMANDS.map(({ name }) => name)

    expect(names).toEqual(uniq(names))
  })

  it('exits through the context when /exit runs', () => {
    const exit = vi.fn<() => void>()

    COMMANDS.find(({ name }) => name === 'exit')?.action?.({ exit })

    expect(exit).toHaveBeenCalledOnce()
  })
})
