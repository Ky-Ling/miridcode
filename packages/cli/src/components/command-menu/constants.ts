import type { Command } from './types'

export const COMMANDS: Command[] = [
  { name: 'new', description: 'Start a new conversation' },
  { name: 'agents', description: 'Switch agents' },
  { name: 'models', description: 'Select AI model for generation' },
  { name: 'sessions', description: 'Browse past sessions' },
  { name: 'theme', description: 'Change color theme' },
  { name: 'login', description: 'Sign in with your browser' },
  { name: 'logout', description: 'Sign out of your account' },
  { name: 'upgrade', description: 'Buy more credits' },
  { name: 'usage', description: 'Open billing portal in your browser' },
  {
    name: 'exit',
    description: 'Quit the application',
    action: (ctx) => {
      ctx.exit()
    },
  },
]
