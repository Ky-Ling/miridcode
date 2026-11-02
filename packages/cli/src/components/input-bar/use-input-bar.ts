import type { TextareaRenderable } from '@opentui/core'
import { useRenderer } from '@opentui/react'
import { useRef } from 'react'

import { isEmpty, trim } from '@/lib/utils'

import { useCommandMenu } from '../command-menu'
import type { InputBarProps } from './types'

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

    if (command.action) {
      command.action({ exit: () => renderer.destroy() })
    } else {
      textarea.insertText(`/${command.name} `)
    }
  }

  const submitText = () => {
    const textarea = textareaRef.current

    if (!textarea) return

    const text = trim(textarea.plainText)

    if (isEmpty(text)) return

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
