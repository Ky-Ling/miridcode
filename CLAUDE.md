# miridcode

Terminal AI coding agent: a Bun workspace whose `packages/cli` is an OpenTUI + React app. It follows the [nightcode](https://github.com/code-with-antonio/nightcode) tutorial chapter by chapter with stricter tooling, so bring tutorial code up to the rules below as you port it.

## Commands

```bash
bun run lint       # oxlint with type information; warnings fail
bun run format     # oxfmt
bun run typecheck  # tsc in every package, then the tooling scripts
```

All three pass before a task is done. Saving in VS Code or running `bun run lint:fix` autofixes most of rules 1, 2, and 6.

## React Compiler

`scripts/react-compiler.ts` runs the official compiler over `packages/cli/src` through `bunfig.toml`, so `bun run start:cli` is compiled. `bun run dev:cli` isn't, because Bun's `--watch` ignores files a plugin loads; its behaviour is the same with more re-renders, so judge performance on `start:cli`. Bun's own `--react-compiler` stays off: for `bun` and `node` targets it emits SSR output that drops state and event handlers, which breaks a terminal app.

Leave memoization to the compiler: `useMemo`, `useCallback`, and `memo` are banned. Keep components pure. Writing to a global or reading a ref during render makes the compiler skip that component with no error, so it runs unoptimized.

## Code structure

`bun run lint` (`.oxlintrc.json`, `scripts/oxlint-plugin.js`) enforces rules 1, 2, and 6, one component per file, and the hook import ban in rule 3. Review covers the rest: JSX-only components, one flat return object, what an `index.ts` exports, rule 5, and the layout below. oxfmt owns formatting: no semicolons, single quotes, sorted imports.

1. **Blank line before `return` and control flow** (`if`, `for`, `while`, `do`, `switch`, `try`) whenever a statement comes before it in the block.
2. **Arrow components.** One with only JSX uses an implicit return: `export const Tag = (…) => (<box>…</box>)`. Hooks are arrow functions too.
3. **Page orchestrator.** State, effects, refs, keyboard input, and handlers with logic live in a colocated `use-<name>.ts` hook (no JSX, returns one flat object). The component calls it once (`const vm = useX()`), then renders JSX only. A screen's `index.tsx` calls one orchestrator hook and passes plain props to presentational children. Trivial prop lookups (`tones[tone]`) may stay in the component. `.tsx` files can't import React's state, effect, and ref hooks or OpenTUI's hooks. The `react(refs)` rule treats any object holding a ref as a ref, so the component destructures refs out by name: `const { inputRef, ...vm } = useX()`. Providers follow the same split.
4. **One component per file.** A private sub-component gets its own file in the folder and isn't exported from its `index.ts`.
5. **Constants by scope.** Used by one file: stays in that file. Used by 2+ files: `constants.ts` in the nearest shared folder. Utility functions never live in component or hook files: put them in the folder's `utils.ts` or in `src/lib/`.
6. **es-toolkit for utility code.** Before hand-writing a helper, check the `es-toolkit-recommend` skill. Import from `@/lib/utils` only (it re-exports es-toolkit and the compat-only `isArray`/`isEmpty`). Use `isNil`/`isNull`/`isUndefined`, `isString`/`isNumber`/`isBoolean`/`isFunction`, `isArray`, `isEmpty`, `compact`, etc., never `== null`, `typeof`, `Array.isArray`, `.length === 0`, or `filter(Boolean)`. `isEmpty('  ')` is false, so trim first when whitespace counts. Native code is allowed only when es-toolkit has no equivalent, with an `oxlint-disable-next-line` comment saying why. A new package gets its own `src/lib/utils.ts` and `@/*` path.

```tsx
// src/screens/session/index.tsx
export const SessionScreen = () => {
  const vm = useSession()

  return <MessageList messages={vm.messages} onSubmit={vm.submit} />
}
```

```ts
// src/screens/session/use-session.ts
export const useSession = () => {
  const [messages, setMessages] = useState<Message[]>([])

  useKeyboard((key) => {
    if (key.name === 'escape') setMessages([])
  })

  const submit = (text: string) => setMessages((list) => [...list, toMessage(text)])

  return { messages, submit }
}
```

Layout, inside `packages/<name>/src/` (kebab-case files, `PascalCase` components, `useCamelCase` hooks):

- `components/<name>.tsx`: a component with only JSX. It becomes `components/<name>/` (`<name>.tsx`, `index.ts`, plus `use-<name>.ts`, `constants.ts`, and `types.ts` when needed) once it has any of those.
- `screens/<name>/`: `index.tsx` (orchestrator), `use-<name>.ts`, `constants.ts`, `components/<part>.tsx` + `components/index.ts`.
- `hooks/use-<name>.ts`: hooks shared across screens.
- Keep components under ~200 lines and hooks under ~300; split beyond that.
