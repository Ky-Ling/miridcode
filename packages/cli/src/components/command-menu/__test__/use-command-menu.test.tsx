import { describe, expect, it } from 'vitest'

import { renderHook } from '@/lib/render-hook'

import { COMMANDS } from '../constants'
import type { Command } from '../types'
import { useCommandMenu } from '../use-command-menu'

const namesOf = (commands: Command[]) => commands.map(({ name }) => name)

const renderMenu = async (text = '/') => {
  const hook = await renderHook(useCommandMenu)

  await hook.run(() => hook.result.current.handleTextChange(text))

  return hook
}

// The scroll rules read a real scrollbox, so it gets one shorter than the command list.
const renderScrollMenu = async () => {
  const hook = await renderHook(useCommandMenu, ({ commands, scrollRef }) => (
    <scrollbox ref={scrollRef} height={3}>
      {commands.map(({ name }) => (
        <text key={name}>{name}</text>
      ))}
    </scrollbox>
  ))

  await hook.run(() => hook.result.current.handleTextChange('/'))

  return {
    ...hook,
    scrollTop: () => hook.result.current.scrollRef.current?.scrollTop,
    pressArrowTimes: async (direction: 'up' | 'down', times: number) => {
      for (const _ of Array.from({ length: times })) {
        await hook.run(() => hook.mockInput.pressArrow(direction))
      }
    },
  }
}

describe('useCommandMenu', () => {
  it('starts closed on the first row with every command', async () => {
    await using hook = await renderHook(useCommandMenu)

    expect(hook.result.current).toMatchObject({
      showCommandMenu: false,
      selectedIndex: 0,
      commands: COMMANDS,
    })
  })

  it('opens for a slash', async () => {
    await using hook = await renderMenu('/')

    expect(hook.result.current.showCommandMenu).toBe(true)
  })

  it('filters commands by the text after the slash', async () => {
    await using hook = await renderMenu('/lo')

    expect(namesOf(hook.result.current.commands)).toEqual(['login', 'logout'])
  })

  it('stays closed for ordinary text', async () => {
    await using hook = await renderMenu('hello')

    expect(hook.result.current.showCommandMenu).toBe(false)
  })

  it('closes once whitespace follows the command', async () => {
    await using hook = await renderMenu('/new')

    await hook.run(() => hook.result.current.handleTextChange('/new '))

    expect(hook.result.current.showCommandMenu).toBe(false)
  })

  it('moves the selection with the arrow keys', async () => {
    await using hook = await renderMenu()

    await hook.run(() => hook.mockInput.pressArrow('down'))
    await hook.run(() => hook.mockInput.pressArrow('down'))
    await hook.run(() => hook.mockInput.pressArrow('up'))

    expect(hook.result.current.selectedIndex).toBe(1)
  })

  it('stops the selection at the first row', async () => {
    await using hook = await renderMenu('/lo')

    await hook.run(() => hook.mockInput.pressArrow('up'))

    expect(hook.result.current.selectedIndex).toBe(0)
  })

  it('stops the selection at the last row', async () => {
    await using hook = await renderMenu('/lo')

    await hook.run(() => hook.mockInput.pressArrow('down'))
    await hook.run(() => hook.mockInput.pressArrow('down'))

    expect(hook.result.current.selectedIndex).toBe(1)
  })

  it('ignores the arrow keys while closed', async () => {
    await using hook = await renderMenu('hello')

    await hook.run(() => hook.mockInput.pressArrow('down'))

    expect(hook.result.current.selectedIndex).toBe(0)
  })

  it('returns to the first row when the text changes', async () => {
    await using hook = await renderMenu()

    await hook.run(() => hook.mockInput.pressArrow('down'))
    await hook.run(() => hook.result.current.handleTextChange('/l'))

    expect(hook.result.current.selectedIndex).toBe(0)
  })

  it('closes on escape', async () => {
    await using hook = await renderMenu()

    await hook.run(() => hook.mockInput.pressEscape())

    expect(hook.result.current.showCommandMenu).toBe(false)
  })

  it('reopens when typing resumes after escape', async () => {
    await using hook = await renderMenu('/l')

    await hook.run(() => hook.mockInput.pressEscape())
    await hook.run(() => hook.result.current.handleTextChange('/lo'))

    expect(hook.result.current.showCommandMenu).toBe(true)
  })

  it('stops filtering while closed', async () => {
    await using hook = await renderMenu('/lo')

    await hook.run(() => hook.mockInput.pressEscape())

    expect(hook.result.current.commands).toEqual(COMMANDS)
  })

  it('caps the menu height at eight rows', async () => {
    await using hook = await renderMenu()

    expect(hook.result.current.menuHeight).toBe(8)
  })

  it('fits the menu height to a short list', async () => {
    await using hook = await renderMenu('/lo')

    expect(hook.result.current.menuHeight).toBe(2)
  })

  it('collapses the menu height when nothing matches', async () => {
    await using hook = await renderMenu('/zzz')

    expect(hook.result.current.menuHeight).toBe(0)
  })

  it('stays at the top while the selection is in view', async () => {
    await using hook = await renderScrollMenu()

    await hook.pressArrowTimes('down', 2)

    expect(hook.scrollTop()).toBe(0)
  })

  it('scrolls down when the selection leaves the bottom', async () => {
    await using hook = await renderScrollMenu()

    await hook.pressArrowTimes('down', 3)

    expect(hook.scrollTop()).toBe(1)
  })

  it('scrolls back up when the selection leaves the top', async () => {
    await using hook = await renderScrollMenu()

    await hook.pressArrowTimes('down', 4)
    await hook.pressArrowTimes('up', 3)

    expect(hook.scrollTop()).toBe(1)
  })

  it('returns to the top when the text changes', async () => {
    await using hook = await renderScrollMenu()

    await hook.run(() => hook.result.current.scrollRef.current?.scrollTo(2))
    await hook.run(() => hook.result.current.handleTextChange('/'))

    expect(hook.scrollTop()).toBe(0)
  })

  describe('takeCommand', () => {
    it('returns the command at the index and closes the menu', async () => {
      await using hook = await renderMenu('/lo')
      let command: Command | undefined

      await hook.run(() => {
        command = hook.result.current.takeCommand(1)
      })

      expect(command?.name).toBe('logout')
      expect(hook.result.current.showCommandMenu).toBe(false)
    })

    it('keeps the menu open when the index has no command', async () => {
      await using hook = await renderMenu('/zzz')
      let command: Command | undefined

      await hook.run(() => {
        command = hook.result.current.takeCommand(0)
      })

      expect(command).toBeUndefined()
      expect(hook.result.current.showCommandMenu).toBe(true)
    })
  })
})
