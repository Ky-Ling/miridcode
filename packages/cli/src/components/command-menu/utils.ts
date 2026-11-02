import { isEmpty } from '@/lib/utils'

import { COMMANDS } from './constants'
import type { Command } from './types'

export const getFilteredCommands = (query: string): Command[] => {
  if (isEmpty(query)) return COMMANDS

  return COMMANDS.filter((cmd) => cmd.name.toLowerCase().startsWith(query.toLowerCase()))
}
