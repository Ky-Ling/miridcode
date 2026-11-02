---
name: vitest
description: Write and review Vitest tests for business logic in this repo. Use when adding or changing business logic, fixing a bug in it, deciding whether something needs a test, or editing a `*.test.ts` file.
---

<!-- Adapted from the Vitest guide "Writing Tests with AI" (vitest.dev/guide/learn/writing-tests-with-ai.html). Vitest publishes no skill of its own. -->

# Vitest

## Scope

Tests cover business logic: the rules that decide what the app does. It lives in two places:

- **Pure rules** in `utils.ts`, `constants.ts`, or `src/lib/`: command filtering, parsing, request building, cost and token calculations. Call them directly.
- **Hook behaviour**: how state changes over time, what each key does, which path a handler takes. Test it through `renderHook` (see below).

Components stay untested: what they draw, layout, and styling. When a rule sits in a component, move it to a hook or utility (CLAUDE.md rules 3 and 5) and test it there. A stateless rule belongs in a utility even when only a hook calls it.

`bun run lint` rejects any test file that isn't `src/**/__test__/<name>.test.ts` beside its `<name>.ts` source, a rendered component, test imports of OpenTUI or React, and `renderHook` or a direct hook import outside a `use-<name>` test. A lint error there means the logic or the test is in the wrong place, so fix the structure instead of disabling the rule. Lint can't judge whether a test covers business logic, so the scope above stays a review check.

## Steps

1. **Read** the source under test and the neighbouring `*.test.ts` files. Done when you can name each rule the code enforces.
2. **Write** `__test__/<name>.test.ts` in the folder that holds the source, covering every rule from step 1 plus the cases below. So `command-menu/utils.ts` gets `command-menu/__test__/utils.test.ts`, importing `../utils`. A nested domain gets its own `__test__/`, at whatever depth its source lives.
3. **Prove it can fail.** Break each rule in the source, confirm a test goes red, then restore the source. A test that stays green when the logic changes is wrong: rewrite it.
4. **Verify.** `bun run test`, `bun run lint`, `bun run format`, and `bun run typecheck` all pass.

## Cases to cover

- The realistic happy path.
- Failure paths: invalid input, thrown errors, rejected promises.
- Edge values: empty string, `null`, `undefined`, `0`, empty arrays, boundaries.

## Writing tests

- One top-level `describe` per exported symbol, named exactly after it.
- `it` names are short lowercase behaviours: `'ignores case'`, `'throws when the key is missing'`.
- Assert on returned values with specific matchers (`toBe`, `toEqual`, `toMatchObject`, `toThrow`), so a refactor that keeps the result keeps the test green. `toBeDefined` and `toBeTruthy` only ever back up a stronger assertion.
- Always `await` async assertions: `await expect(load()).rejects.toThrow(NotFoundError)`. Without `await` the test passes whatever happens.
- Build fixtures with a typed helper that takes `Partial<T>`. Types stay strict in tests: `as const` is the only cast, and `noUncheckedIndexedAccess` means array reads need `?.` or a prior `toHaveLength`.

## Testing hooks

`renderHook` from `@/lib/render-hook` runs the hook in a real OpenTUI renderer, so `useKeyboard` and `useRenderer` work unmocked and keys are real events. It exposes state, input, and `isDestroyed()` for a hook that closes the app: assert on those and on callbacks.

```ts
await using hook = await renderHook(useCommandMenu)

await hook.run(() => hook.result.current.handleTextChange('/lo'))
await hook.run(() => hook.mockInput.pressArrow('down'))

expect(hook.result.current.selectedIndex).toBe(1)
```

- `await using` destroys the renderer when the test ends.
- Put every state change or key press inside `hook.run`, which flushes React and the renderer. Read `hook.result.current` fresh after each one, because handlers close over the state of their render.
- A hook that reads from a real element passes a function that renders it as the second argument, and makes the test `use-<name>.test.tsx`. That's the only `.tsx` test, and the element exists to feed the hook.

## Mocking

Mock only boundaries the logic doesn't own: network, file system, clock, model providers. Run real project code otherwise.

```ts
vi.mock(import('../client'), async (importOriginal) => ({
  ...(await importOriginal()),
  fetchUsage: vi.fn(),
}))

vi.mocked(fetchUsage).mockRejectedValue(new Error('offline'))
```

Use the `import()` form so paths are type-checked and survive renames. `mockReset` clears every `vi.fn()` and `restoreMocks` restores spies between tests. Fake timers aren't covered by them, so pair `vi.useFakeTimers()` with `vi.useRealTimers()` in `afterEach`. Advancing fake timers also moves `Date`.

## Gotchas

- Run `bun run test`. `bun test` starts Bun's own runner, which can pass while skipping `vitest.config.ts`, so its green means nothing here.
- `bun --bun` in the script is deliberate: it runs tests on the app's runtime, so Bun APIs work in code under test.
- Use `vitest run` for one-off runs. Bare `vitest` stays in watch mode and never exits.
