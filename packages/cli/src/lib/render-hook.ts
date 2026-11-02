import { testRender } from '@opentui/react/test-utils'
import { act, createElement, useEffect, type ReactNode } from 'react'

import { isUndefined } from '@/lib/utils'

// Runs a hook in a real OpenTUI renderer, which `useKeyboard` and `useRenderer` need.
// It exposes state, input, and teardown, so a hook test can't assert on what gets drawn.
export const renderHook = async <T>(
  useHook: () => T,
  renderUi: (value: T) => ReactNode = () => null,
) => {
  let current: T | undefined

  const Harness = () => {
    const value = useHook()

    useEffect(() => {
      current = value
    })

    return renderUi(value)
  }

  // Kitty mode marks Escape explicitly, so it skips OpenTUI's wait for a lone Escape.
  const { dispose, flush, mockInput, renderer } = await testRender(createElement(Harness), {
    width: 80,
    height: 24,
    kittyKeyboard: true,
  })

  return {
    mockInput,
    isDestroyed: () => renderer.isDestroyed,
    result: {
      get current() {
        if (isUndefined(current)) throw new Error('The hook has not rendered yet.')

        return current
      },
    },
    run: (action: () => unknown) =>
      act(async () => {
        await action()
        await flush()
      }),
    [Symbol.asyncDispose]: dispose,
  }
}
