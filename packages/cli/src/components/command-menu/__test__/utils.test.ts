import { describe, expect, it, vi } from 'vitest'

import { COMMANDS } from '../constants'
import type { Command, CommandContext } from '../types'
import {
  getCommandQuery,
  getFilteredCommands,
  getNextIndex,
  getScrollTarget,
  isCommandInput,
  runCommand,
} from '../utils'

const namesFor = (query: string) => getFilteredCommands(query).map(({ name }) => name)

const command = (partial: Partial<Command> = {}): Command => ({
  name: 'new',
  description: 'Start a new conversation',
  ...partial,
})

const actionSpy = () => vi.fn<NonNullable<Command['action']>>()
const insertSpy = () => vi.fn<(text: string) => void>()
const context = (): CommandContext => ({ exit: vi.fn<() => void>() })

describe('isCommandInput', () => {
  it('accepts a lone slash', () => {
    expect(isCommandInput('/')).toBe(true)
  })

  it('accepts a partial command name', () => {
    expect(isCommandInput('/mod')).toBe(true)
  })

  it('rejects empty text', () => {
    expect(isCommandInput('')).toBe(false)
  })

  it('rejects text without a leading slash', () => {
    expect(isCommandInput('fix /etc/hosts')).toBe(false)
  })

  it('rejects a slash after leading whitespace', () => {
    expect(isCommandInput(' /new')).toBe(false)
  })

  it('rejects a command followed by a space', () => {
    expect(isCommandInput('/new ')).toBe(false)
  })

  it('rejects a command followed by a newline', () => {
    expect(isCommandInput('/new\n')).toBe(false)
  })
})

describe('getCommandQuery', () => {
  it('returns the text after the slash', () => {
    expect(getCommandQuery('/mod')).toBe('mod')
  })

  it('returns an empty query for a lone slash', () => {
    expect(getCommandQuery('/')).toBe('')
  })
})

describe('getFilteredCommands', () => {
  it('returns every command for an empty query', () => {
    expect(getFilteredCommands('')).toEqual(COMMANDS)
  })

  it('returns each command starting with the query', () => {
    expect(namesFor('lo')).toEqual(['login', 'logout'])
  })

  it('ignores case in the query', () => {
    expect(namesFor('EX')).toEqual(['exit'])
  })

  it('skips matches in the middle of a name', () => {
    expect(namesFor('xit')).toEqual([])
  })
})

describe('getNextIndex', () => {
  it('moves down one row', () => {
    expect(getNextIndex(0, 1, 3)).toBe(1)
  })

  it('moves up one row', () => {
    expect(getNextIndex(2, -1, 3)).toBe(1)
  })

  it('stops at the first row', () => {
    expect(getNextIndex(0, -1, 3)).toBe(0)
  })

  it('stops at the last row', () => {
    expect(getNextIndex(2, 1, 3)).toBe(2)
  })

  it('stays on the only row', () => {
    expect(getNextIndex(0, 1, 1)).toBe(0)
  })

  it('stays at zero for an empty list', () => {
    expect(getNextIndex(0, -1, 0)).toBe(0)
  })
})

describe('getScrollTarget', () => {
  it('leaves a row inside the viewport alone', () => {
    expect(getScrollTarget(3, 2, 4)).toBeUndefined()
  })

  it('leaves the top row of the viewport alone', () => {
    expect(getScrollTarget(2, 2, 4)).toBeUndefined()
  })

  it('leaves the bottom row of the viewport alone', () => {
    expect(getScrollTarget(5, 2, 4)).toBeUndefined()
  })

  it('scrolls up to a row above the viewport', () => {
    expect(getScrollTarget(1, 2, 4)).toBe(1)
  })

  it('scrolls down so a row below the viewport sits on the bottom edge', () => {
    expect(getScrollTarget(6, 2, 4)).toBe(3)
  })
})

describe('runCommand', () => {
  it('runs the action with the context', () => {
    const action = actionSpy()
    const ctx = context()

    runCommand(command({ action }), ctx, insertSpy())

    expect(action).toHaveBeenCalledExactlyOnceWith(ctx)
  })

  it('leaves the input alone when the command has an action', () => {
    const insertText = insertSpy()

    runCommand(command({ action: actionSpy() }), context(), insertText)

    expect(insertText).not.toHaveBeenCalled()
  })

  it('inserts the command and a trailing space when it has no action', () => {
    const insertText = insertSpy()

    runCommand(command({ name: 'models' }), context(), insertText)

    expect(insertText).toHaveBeenCalledExactlyOnceWith('/models ')
  })

  it('inserts text that closes the command menu', () => {
    const insertText = insertSpy()

    runCommand(command(), context(), insertText)

    expect(isCommandInput(insertText.mock.calls[0]?.[0] ?? '/')).toBe(false)
  })
})
