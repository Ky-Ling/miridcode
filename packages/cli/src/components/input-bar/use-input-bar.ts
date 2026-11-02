import type { TextareaRenderable } from '@opentui/core'
import { useRenderer } from '@opentui/react'
import { useRef } from 'react'

import { isUndefined } from '@/lib/utils'

import { runCommand, useCommandMenu } from '../command-menu'
import type { InputBarProps } from './types'
import { getSubmitText } from './utils'

export const useInputBar = ({ onSubmit, disabled }: Required<InputBarProps>) => {
  const textareaRef = useRef<TextareaRenderable>(null)
  const renderer = useRenderer()
  const { handleTextChange, takeCommand, ...menu } = useCommandMenu()

  const handleContentChange = () => {
    const textarea = textareaRef.current

    if (textarea) {
      handleTextChange(textarea.plainText)
    }
  }

  const executeCommand = (index: number) => {
    const textarea = textareaRef.current
    const command = takeCommand(index)

    if (!textarea || !command) return

    textarea.setText('')
    runCommand(command, { exit: () => renderer.destroy() }, (text) => textarea.insertText(text))
  }

  const submitText = () => {
    const textarea = textareaRef.current

    if (!textarea) return

    const text = getSubmitText(textarea.plainText)

    if (isUndefined(text)) return

    onSubmit(text)
    textarea.setText('')
  }

  const handleSubmit = () => {
    if (disabled) return

    if (menu.showCommandMenu) {
      executeCommand(menu.selectedIndex)
    } else {
      submitText()
    }
  }

  return {
    ...menu,
    textareaRef,
    handleContentChange,
    handleSubmit,
    executeCommand,
  }
}
