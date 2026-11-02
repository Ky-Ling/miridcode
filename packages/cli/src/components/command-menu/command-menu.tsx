import { TextAttributes, type ScrollBoxRenderable } from '@opentui/core'
import type { RefObject } from 'react'

import { isEmpty } from '@/lib/utils'

import { CommandRow } from './command-row'
import type { Command } from './types'

type CommandMenuProps = {
  commands: Command[]
  height: number
  selectedIndex: number
  scrollRef: RefObject<ScrollBoxRenderable | null>
  onSelect: (index: number) => void
  onExecute: (index: number) => void
}

export const CommandMenu = ({
  commands,
  height,
  selectedIndex,
  scrollRef,
  onSelect,
  onExecute,
}: CommandMenuProps) =>
  isEmpty(commands) ? (
    <box paddingX={1}>
      <text attributes={TextAttributes.DIM}>No matching commands</text>
    </box>
  ) : (
    <scrollbox ref={scrollRef} height={height}>
      {commands.map((command, index) => (
        <CommandRow
          key={command.name}
          command={command}
          selected={index === selectedIndex}
          onSelect={() => onSelect(index)}
          onExecute={() => onExecute(index)}
        />
      ))}
    </scrollbox>
  )
