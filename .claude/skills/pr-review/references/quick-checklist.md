# Quick Checklist

A fast pass before the ten-dimension review. Skip anything `bun run lint` already reports.

## 🔴 Blocking

### Rules lint can't check (`CLAUDE.md`)

```
□ Does each component render JSX only, with logic in its hook?
□ Does each hook return one flat object?
□ Does an index.ts export a private sub-component?
□ Are constants placed by scope, and utilities outside component and hook files?
□ Does the file layout match the Layout section?
```

### Type safety

```
□ Are there `any` types, `as unknown as` casts, or unjustified `!` assertions?
□ Are there @ts-ignore, @ts-expect-error, or oxlint-disable comments without a reason?
□ Does external data (JSON.parse, API responses, tool input) get validated before use?
```

### Tutorial port

```
□ Was tutorial code brought up to the rules, not pasted as is?
□ Did any behaviour change beyond tooling and style?
□ Do ported chapters apply the known tutorial fixes?
```

## 🟡 Structure

```
□ Is any component over ~200 lines, or any hook over ~300?
□ Do hooks have more than 3 levels of nesting?
□ Does any component take more than 10 props?
□ Was an existing helper, hook, or es-toolkit function missed before writing a new one?
```

## 🟢 Quality

```
□ Is there leftover debug code: console.log, commented-out code, TODOs with no owner?
□ Are error messages useful to the user, and free of secrets?
□ Are magic numbers named when they encode a decision?
```

## 📋 The PR itself

### Commits

```
□ Do messages follow Conventional Commits with a scope, per the submit-pr skill?
□ Do they describe the change?
```

### Description

```
□ Does it explain the purpose of the change?
□ Does it link the issue or tutorial chapter it implements?
```

### Scope

```
□ Is the change focused on one purpose?
□ Are unrelated changes mixed in?
□ Are generated files or lockfile changes expected?
```
