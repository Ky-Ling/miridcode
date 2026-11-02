import { COMMANDS } from './constants'
import type { Command } from './types'

// Align all command names in a fixed-width column so their descriptions
// start at the same horizontal position for a clean tabular look.
// The width adjusts to accommodate the longest command name.
const COMMAND_COL_WIDTH = Math.max(...COMMANDS.map((cmd) => cmd.name.length)) + 4

type CommandRowProps = {
  command: Command
  selected: boolean
  onSelect: () => void
  onExecute: () => void
}

export const CommandRow = ({ command, selected, onSelect, onExecute }: CommandRowProps) => (
  <box
    flexDirection="row"
    paddingX={1}
    height={1}
    overflow="hidden"
    backgroundColor={selected ? '#89B4FA' : undefined}
    onMouseMove={onSelect}
    onMouseDown={onExecute}
  >
    <box width={COMMAND_COL_WIDTH} flexShrink={0}>
      <text selectable={false} fg={selected ? 'black' : 'white'}>
        /{command.name}
      </text>
    </box>
    <box flexGrow={1} flexShrink={1} overflow="hidden">
      <text selectable={false} fg={selected ? 'black' : 'gray'}>
        {command.description}
      </text>
    </box>
  </box>
)
