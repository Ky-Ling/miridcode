import type { KeyBinding } from '@opentui/core'

import { CommandMenu } from '../command-menu'
import { StatusBar } from './status-bar'
import type { InputBarProps } from './types'
import { useInputBar } from './use-input-bar'

const PANEL_BACKGROUND = '#1A1A24'

const BORDER_CHARS = {
  topLeft: '',
  bottomLeft: '╹',
  vertical: '┃',
  topRight: '',
  bottomRight: '',
  horizontal: ' ',
  bottomT: '',
  topT: '',
  cross: '',
  leftT: '',
  rightT: '',
}

const TEXTAREA_KEY_BINDINGS: KeyBinding[] = [
  { name: 'return', action: 'submit' },
  { name: 'kpenter', action: 'submit' },
  { name: 'return', shift: true, action: 'newline' },
  { name: 'kpenter', shift: true, action: 'newline' },
  // macOS Terminal sends Shift+Enter as plain Enter, so Option+Enter is the second way in.
  { name: 'return', meta: true, action: 'newline' },
]

export const InputBar = ({ onSubmit, disabled = false }: InputBarProps) => {
  const { textareaRef, scrollRef, ...vm } = useInputBar({ onSubmit, disabled })

  return (
    <box width="100%" alignItems="center">
      <box border={['left']} borderColor="cyan" customBorderChars={BORDER_CHARS} width="100%">
        <box
          position="relative"
          justifyContent="center"
          paddingX={2}
          paddingY={1}
          backgroundColor={PANEL_BACKGROUND}
          width="100%"
          gap={1}
        >
          {vm.showCommandMenu && (
            <box
              position="absolute"
              bottom="100%"
              left={0}
              width="100%"
              backgroundColor={PANEL_BACKGROUND}
              zIndex={10}
            >
              <CommandMenu
                commands={vm.commands}
                height={vm.menuHeight}
                selectedIndex={vm.selectedIndex}
                scrollRef={scrollRef}
                onSelect={vm.setSelectedIndex}
                onExecute={vm.executeCommand}
              />
            </box>
          )}
          <textarea
            ref={textareaRef}
            focused={!disabled}
            keyBindings={TEXTAREA_KEY_BINDINGS}
            onContentChange={vm.handleContentChange}
            onSubmit={vm.handleSubmit}
            placeholder={`Ask anything... "Fix a bug in the database"`}
          />
          <StatusBar />
        </box>
      </box>
    </box>
  )
}
