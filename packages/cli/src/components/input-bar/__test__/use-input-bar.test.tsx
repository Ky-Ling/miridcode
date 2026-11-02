import { describe, expect, it, vi } from 'vitest'

import { renderHook } from '@/lib/render-hook'

import type { InputBarProps } from '../types'
import { useInputBar } from '../use-input-bar'

// No whitespace keeps the menu open, and wrapping is the only time up and down move the cursor.
const WRAPPED_PATH = `/${'a'.repeat(100)}`

// The hook reads its text from a real textarea, so it gets one to type into.
const renderInputBar = async (text: string, { disabled = false } = {}) => {
  const onSubmit = vi.fn<InputBarProps['onSubmit']>()

  const hook = await renderHook(
    () => useInputBar({ onSubmit, disabled }),
    ({ textareaRef, handleContentChange }) => (
      <textarea ref={textareaRef} focused onContentChange={handleContentChange} />
    ),
  )

  await hook.run(() => hook.mockInput.typeText(text))

  return {
    ...hook,
    onSubmit,
    inputText: () => hook.result.current.textareaRef.current?.plainText,
    cursorOffset: () => hook.result.current.textareaRef.current?.cursorOffset,
    placeCursor: (offset: number) =>
      hook.run(() => {
        const textarea = hook.result.current.textareaRef.current

        if (textarea) textarea.cursorOffset = offset
      }),
    submit: () => hook.run(() => hook.result.current.handleSubmit()),
  }
}

describe('useInputBar', () => {
  it('submits trimmed text and clears the input', async () => {
    await using hook = await renderInputBar('  hello  ')

    await hook.submit()

    expect(hook.onSubmit).toHaveBeenCalledExactlyOnceWith('hello')
    expect(hook.inputText()).toBe('')
  })

  it('keeps blank input without submitting it', async () => {
    await using hook = await renderInputBar('   ')

    await hook.submit()

    expect(hook.onSubmit).not.toHaveBeenCalled()
    expect(hook.inputText()).toBe('   ')
  })

  it('submits text that continues past a command name', async () => {
    await using hook = await renderInputBar('/new hello')

    await hook.submit()

    expect(hook.onSubmit).toHaveBeenCalledExactlyOnceWith('/new hello')
  })

  it('holds text while disabled', async () => {
    await using hook = await renderInputBar('hello', { disabled: true })

    await hook.submit()

    expect(hook.onSubmit).not.toHaveBeenCalled()
    expect(hook.inputText()).toBe('hello')
  })

  it('holds an open command menu while disabled', async () => {
    await using hook = await renderInputBar('/mod', { disabled: true })

    await hook.submit()

    expect(hook.inputText()).toBe('/mod')
    expect(hook.result.current.showCommandMenu).toBe(true)
  })

  it('inserts the selected command instead of submitting', async () => {
    await using hook = await renderInputBar('/mod')

    await hook.submit()

    expect(hook.onSubmit).not.toHaveBeenCalled()
    expect(hook.inputText()).toBe('/models ')
    expect(hook.result.current.showCommandMenu).toBe(false)
  })

  it('uses the row chosen with the arrow keys', async () => {
    await using hook = await renderInputBar('/lo')

    await hook.run(() => hook.mockInput.pressArrow('down'))
    await hook.submit()

    expect(hook.inputText()).toBe('/logout ')
  })

  it('keeps the cursor on its line when up reaches an open menu', async () => {
    await using hook = await renderInputBar(WRAPPED_PATH)

    await hook.run(() => hook.mockInput.pressArrow('up'))

    expect(hook.cursorOffset()).toBe(WRAPPED_PATH.length)
  })

  it('keeps the cursor on its line when down reaches an open menu', async () => {
    await using hook = await renderInputBar(WRAPPED_PATH)

    await hook.placeCursor(0)
    await hook.run(() => hook.mockInput.pressArrow('down'))

    expect(hook.cursorOffset()).toBe(0)
  })

  it('submits normally once escape closes the menu', async () => {
    await using hook = await renderInputBar('/lo')

    await hook.run(() => hook.mockInput.pressEscape())
    await hook.submit()

    expect(hook.onSubmit).toHaveBeenCalledExactlyOnceWith('/lo')
  })

  it('leaves the input alone when no command matches', async () => {
    await using hook = await renderInputBar('/zzz')

    await hook.submit()

    expect(hook.onSubmit).not.toHaveBeenCalled()
    expect(hook.inputText()).toBe('/zzz')
    expect(hook.result.current.showCommandMenu).toBe(true)
  })

  it('exits for a command whose action asks to', async () => {
    await using hook = await renderInputBar('/exit')

    await hook.submit()

    expect(hook.isDestroyed()).toBe(true)
  })

  describe('executeCommand', () => {
    it('runs the row it is given, not the selected one', async () => {
      await using hook = await renderInputBar('/lo')

      await hook.run(() => hook.result.current.executeCommand(1))

      expect(hook.inputText()).toBe('/logout ')
    })
  })
})
