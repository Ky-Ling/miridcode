# Review Guide

Anti-patterns for each dimension, for when a finding needs a concrete comparison. The timeout, output cap, path, `grep`, and `replace` examples were run on Bun 1.4.

## Over-engineering

```ts
// Wrapper adding no value
const runGrep = (args: string[]) => spawnGrep(args)
// Call spawnGrep directly

// Config object for a single value
const config = { retryCount: 3 }
retry(run, config.retryCount)
// Use a constant, or inline the value

// Generic with one instantiation
const process = <T extends Command>(item: T) => run(item)
// T is always Command, so use Command directly

// Option with one caller
const loadSession = (id: string, { includeDrafts = false } = {}) => {}
// Nothing passes includeDrafts, so remove it
```

## Simplicity

```ts
// Before: nested
if (command) {
  if (command.action) {
    command.action(ctx)
  }
}

// After: optional call
command?.action?.(ctx)
```

```ts
// Before: repeated conditionals
if (mode === 'PLAN') return 'cyan'
if (mode === 'BUILD') return 'green'

// After: lookup map
const MODE_COLORS = { PLAN: 'cyan', BUILD: 'green' }
```

## Robustness

### Timeouts that don't stop anything

`proc.kill()` kills only `bash`. Its children keep the pipes open, so a 300ms timeout on `sleep 4` took 4005ms.

```ts
// Bad
const proc = Bun.spawn(['bash', '-c', command], { stdout: 'pipe', stderr: 'pipe' })
setTimeout(() => proc.kill(), timeout)

// Good: a process group kill returned in 302ms
const proc = Bun.spawn(['bash', '-c', command], {
  stdout: 'pipe',
  stderr: 'pipe',
  detached: true,
})
setTimeout(() => process.kill(-proc.pid, 'SIGKILL'), timeout)
```

### Output buffered before it's limited

```ts
// Bad: `yes` fills memory before truncate ever runs
const output = await new Response(proc.stdout).text()
return truncate(output, MAX_OUTPUT)

// Good: stop reading at the limit, then kill the group
const reader = proc.stdout.getReader()
let size = 0
while (size < MAX_OUTPUT) {
  const { value, done } = await reader.read()
  if (done) break
  size += value.length
}
process.kill(-proc.pid, 'SIGKILL')
```

### Effects that outlive the component

```ts
// Bad: the timer keeps firing after unmount
useEffect(() => {
  setInterval(refresh, 1000)
}, [])

// Good
useEffect(() => {
  const timer = setInterval(refresh, 1000)

  return () => clearInterval(timer)
}, [])
```

```ts
// Bad: a slow response can update state after the session changed
useEffect(() => {
  void loadSession(id).then(setSession)
}, [id])

// Good
useEffect(() => {
  let active = true

  void loadSession(id).then((session) => {
    if (active) setSession(session)
  })

  return () => {
    active = false
  }
}, [id])
```

### Unvalidated external data

```ts
// Bad
const auth = JSON.parse(text) as AuthData

// Good
const auth = authSchema.parse(JSON.parse(text))
```

## Consistency

```ts
// Bad: three names for one kind of handler
const handleSubmit = () => {}
const onCancel = () => {}
const clickDelete = () => {}

// Good
const handleSubmit = () => {}
const handleCancel = () => {}
const handleDelete = () => {}
```

**Justified divergence:** ask "could this code use the existing pattern without a hack?" If not, omit it. `command-row.tsx` using `Math.max` isn't an es-toolkit violation, because `max` exists only in compat and the `es-toolkit-recommend` skill prefers the language feature.

## Impact

### A default change hits implicit callers

```ts
// Before
const useCommandMenu = (maxVisible = 8) => {}

// The PR changes the default for one screen
const useCommandMenu = (maxVisible = 12) => {}

// Every caller passing nothing now shows a taller menu.
// Pass the new value at the call site.
```

### Refactors that change behaviour

```ts
// Before
createCliRenderer({ targetFps: 60, exitOnCtrlC: false })

// A cleanup drops the options as "unused"
createCliRenderer()

// Ctrl+C now quits the app, and the frame rate drops.
```

**Self-check:** would a user notice this, even though it wasn't the goal? If yes, it's an Impact issue. If no, omit it.

## Security

### Paths checked as text

`relative()` looks at the path string, so a symlink inside the project passed the check and read a file outside it.

```ts
// Bad
const resolved = resolve(cwd, path)
if (relative(cwd, resolved).startsWith('..')) throw new Error('Outside project')

// Good: compare real paths
const real = realpathSync(resolve(cwd, path))
if (real !== root && !real.startsWith(`${root}${sep}`)) throw new Error('Outside project')
```

### Patterns treated as options

A pattern of `--version` made `grep` print its version, so model input can reach grep's flags.

```ts
// Bad
Bun.spawn(['grep', '-rn', pattern, path])

// Good
Bun.spawn(['grep', '-rn', '-e', pattern, path])
```

### Replacement text treated as a template

```ts
// Bad: `a$&b` becomes `aOLDb`, which corrupts the edited file
content.replace(oldString, newString)

// Good
content.replace(oldString, () => newString)
```

### Secrets inherited by commands

```ts
// Bad: every secret in the CLI's environment reaches model-run commands
Bun.spawn(['bash', '-c', command], { env: { ...process.env, TERM: 'dumb' } })

// Good
Bun.spawn(['bash', '-c', command], {
  env: { PATH: process.env.PATH, HOME: process.env.HOME, TERM: 'dumb' },
})
```

## Testing

```ts
// Bad: passes after any refactor that keeps the mock call
it('calls Bun.spawn', () => {
  runTool('grep', input)
  expect(spawn).toHaveBeenCalled()
})

// Good: asserts on the result, and would catch the original bug
it('treats a pattern starting with a dash as data', async () => {
  const result = await runTool('grep', { pattern: '--version', path: '.' })

  expect(result.matches).toEqual([])
})
```

## Architecture

### Unjustified divergence

```tsx
// Bad: a component reaches into state its siblings receive as props
const MessageList = () => {
  const vm = useSession()

  return <Messages items={vm.messages} />
}

// Good: the screen's orchestrator hook owns it
const MessageList = ({ messages }: MessageListProps) => <Messages items={messages} />
```

### One value in several forms

```ts
// Bad: three forms of one width that must change together
const MENU_WIDTH = 78
const MENU_INNER_WIDTH = 74
const MENU_WIDTH_LABEL = '78 columns'

// Good: derive them
const MENU_WIDTH = 78
const MENU_INNER_WIDTH = MENU_WIDTH - 4
```

### Omit these

- **The pattern matches precedent:** other screens do the same thing.
- **Scaffolding:** thin hooks and placeholder props such as `onSubmit={() => {}}` are expected while a tutorial chapter is in progress.
- **Speculative extensibility:** "if we add X later, this needs rewriting" isn't an issue today.
