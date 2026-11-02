---
name: es-toolkit-guide
description: How es-toolkit is set up in this repo. Use when the user asks how to import or install it, how to expose a compat or subpath function through `@/lib/utils`, or how to add it to a new package.
argument-hint: '[topic: import, utils, new package, docs]'
allowed-tools: Read, Grep, Glob, Bash
license: MIT
---

<!-- Adapted from toss/es-toolkit es-toolkit-plugin at 159d0ce. MIT license: ../es-toolkit-LICENSE -->

# es-toolkit Usage Guide

Answer $ARGUMENTS for this repo: a Bun workspace with es-toolkit installed per package. Rule 6 in `CLAUDE.md` says when to use it. This skill covers how it's wired.

## Importing

Import by name from `@/lib/utils`:

```ts
import { chunk, debounce, isEmpty } from '@/lib/utils'
```

`packages/cli/src/lib/utils.ts` is the only file allowed to import `es-toolkit` directly, and lint enforces that. It exposes everything from the main entry, plus compat's `isArray` and `isEmpty`. Compat-only functions and subpath exports such as `es-toolkit/server` and `es-toolkit/map` aren't available until you add them.

Check what's available with the search script:

```bash
bun .claude/skills/es-toolkit-recommend/find-exports.ts '^isEmpty$'
```

## Exposing a function through `utils.ts`

Add a named re-export for a name that shows `no` in the `@/lib/utils` column:

```ts
export { isArray, isEmpty, isObject } from 'es-toolkit/compat'
```

Add only names the main entry doesn't have. A named re-export overrides `export *`, so re-exporting a compat `merge` or `debounce` would silently change behaviour for every caller. `es-toolkit/fp` has curried versions of names like `map`, so alias those: `export { map as fpMap } from 'es-toolkit/fp'`.

Done when `bun run typecheck` passes with the import in use, and the script shows `yes` for names you didn't alias.

## Adding es-toolkit to a new package

1. Install it in the package, because each package declares its own dependencies:

   ```bash
   cd packages/<name> && bun add es-toolkit
   ```

2. Copy `packages/cli/src/lib/utils.ts` to the package's `src/lib/utils.ts`.
3. Add the alias to the package's `tsconfig.json`:

   ```json
   { "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }
   ```

Done when `bun run lint` and `bun run typecheck` pass with an import from `@/lib/utils` in that package.

## Docs

End answers with the links that apply:

- Usage: https://es-toolkit.dev/usage.html
- Strict vs compat: https://es-toolkit.dev/compat/intro.html
- Bundle size: https://es-toolkit.dev/bundle-size.html
- Performance: https://es-toolkit.dev/performance.html

Quote size or speed numbers only from those pages or a measurement of this repo.
