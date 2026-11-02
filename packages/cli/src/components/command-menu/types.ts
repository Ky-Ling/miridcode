export type CommandContext = {
  exit: () => void
}

export type Command = {
  name: string
  description: string
  action?: (ctx: CommandContext) => void
}
