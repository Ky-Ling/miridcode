---
name: es-toolkit-recommend
description: Find the right es-toolkit function for a need or a piece of code, and how to import it in this repo. Use when the user asks which utility to use, or before hand-writing a helper.
argument-hint: '<what you need, or a code snippet>'
allowed-tools: Read, Grep, Glob, Bash
license: MIT
---

<!-- Adapted from toss/es-toolkit es-toolkit-plugin at 159d0ce. MIT license: ../es-toolkit-LICENSE -->

# es-toolkit Recommendation

Recommend a utility for $ARGUMENTS, from the version installed in this repo. es-toolkit changes faster than training data, so a function name counts only once the search below finds it.

## Step 1: Understand the need

Identify the operation and the data types involved. If the input is lodash code, use the `es-toolkit-migrate` skill instead. Done when you can name search terms for it.

## Step 2: Search the installed package

Run from the repo root, replacing the pattern with terms for the need:

```bash
bun .claude/skills/es-toolkit-recommend/find-exports.ts 'merge|assign'
```

The output is authoritative. `@/lib/utils` shows `yes` when a name can be imported today. A name can appear in several entry points, so read every match. Done when you have the candidates, or have tried two or three other terms and found none.

## Step 3: Read the declaration

Declarations are at `packages/cli/node_modules/es-toolkit/dist/<category>/<fn>.d.ts`, and compat ones at `dist/compat/<category>/<fn>.d.ts`. Take the signature, JSDoc, and `@example` from there. The package ships no spec files. Check the `.mjs` beside it for mutation and error behaviour. Done when you can state what the function does from its source.

## Step 4: Pick the path

Take the first one that fits:

1. **Available:** `@/lib/utils` shows `yes`. Import it from there.
2. **Language feature:** only compat has it, and syntax does the job (`?.` over `get`, `Math.max` over `max`). Use the syntax, and keep `utils.ts` small.
3. **Worth adding:** it's compat-only or subpath-only and there's no simple syntax for it. Add it to `utils.ts` following the `es-toolkit-guide` skill, and include that edit.
4. **Nothing fits:** say so and suggest native code. If lint rejects that native form, add the `oxlint-disable-next-line` comment that rule 6 in `CLAUDE.md` asks for.

## Step 5: Respond

For each function give its category, the import, the doc link, what it does, an example from its JSDoc, and why it fits.

```ts
import { chunk } from '@/lib/utils'
```

Doc links use the category folder from the declaration path, which can differ between strict and compat. Leave a link out if you can't confirm the page exists.

- Strict: `https://es-toolkit.dev/reference/{category}/{fn}.html`
- Compat: `https://es-toolkit.dev/compat/reference/{category}/{fn}.html`
- fp: `https://es-toolkit.dev/fp/reference/{fn}.html`

For more than one candidate, add a comparison table and a "When to choose which" line with clear criteria, such as `groupBy` for categorizing, `countBy` for tallying, and `keyBy` for lookup maps.

| Function | Input | Behaviour | Returns |
| -------- | ----- | --------- | ------- |
