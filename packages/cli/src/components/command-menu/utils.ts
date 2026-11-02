import { clamp, isEmpty } from '@/lib/utils'

import { COMMANDS } from './constants'
import type { Command, CommandContext } from './types'

// Whitespace ends the command name, so `/new hello` is ordinary text.
export const isCommandInput = (text: string) => text.startsWith('/') && !/\s/.test(text)

export const getCommandQuery = (text: string) => text.slice(1)

export const getFilteredCommands = (query: string): Command[] => {
  if (isEmpty(query)) return COMMANDS

  return COMMANDS.filter((cmd) => cmd.name.toLowerCase().startsWith(query.toLowerCase()))
}

export const getNextIndex = (index: number, step: number, count: number) =>
  count === 0 ? 0 : clamp(index + step, 0, count - 1)

// Undefined means the row is already in view.
export const getScrollTarget = (row: number, scrollTop: number, height: number) => {
  if (row < scrollTop) return row

  return row > scrollTop + height - 1 ? row - height + 1 : undefined
}

export const runCommand = (
  command: Command,
  ctx: CommandContext,
  insertText: (text: string) => void,
) => {
  if (command.action) {
    command.action(ctx)
  } else {
    insertText(`/${command.name} `)
  }
}
