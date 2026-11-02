import type { ScrollBoxRenderable } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { useEffect, useRef, useState } from 'react'

import { clamp, isUndefined } from '@/lib/utils'

import {
  getCommandQuery,
  getFilteredCommands,
  getNextIndex,
  getScrollTarget,
  isCommandInput,
} from './utils'

const MAX_VISIBLE_ITEMS = 8

export const useCommandMenu = () => {
  const [textValue, setTextValue] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const scrollRef = useRef<ScrollBoxRenderable>(null)

  const commandQuery = showCommandMenu ? getCommandQuery(textValue) : ''
  const commands = getFilteredCommands(commandQuery)
  const menuHeight = clamp(commands.length, MAX_VISIBLE_ITEMS)

  const handleTextChange = (text: string) => {
    setTextValue(text)
    setSelectedIndex(0)

    // Jump back to the top of the list when the user types a new character
    scrollRef.current?.scrollTo(0)

    setShowCommandMenu(isCommandInput(text))
  }

  // Take the command at an index and close the menu; the caller runs it
  const takeCommand = (index: number) => {
    const command = commands[index]

    if (command) {
      setShowCommandMenu(false)
    }

    return command
  }

  // Keep the highlighted item visible when arrowing past either edge of the list
  useEffect(() => {
    const scrollbox = scrollRef.current

    if (!scrollbox) return

    const target = getScrollTarget(selectedIndex, scrollbox.scrollTop, scrollbox.viewport.height)

    if (!isUndefined(target)) scrollbox.scrollTo(target)
  }, [selectedIndex])

  const moveSelection = (step: number) =>
    setSelectedIndex((index) => getNextIndex(index, step, commands.length))

  useKeyboard((key) => {
    if (!showCommandMenu) return

    if (key.name === 'escape') {
      key.preventDefault()
      setShowCommandMenu(false)
    } else if (key.name === 'up') {
      key.preventDefault()
      moveSelection(-1)
    } else if (key.name === 'down') {
      key.preventDefault()
      moveSelection(1)
    }
  })

  return {
    showCommandMenu,
    commands,
    menuHeight,
    selectedIndex,
    scrollRef,
    handleTextChange,
    takeCommand,
    setSelectedIndex,
  }
}
