---
name: es-toolkit-migrate
description: Convert lodash code to this repo's es-toolkit imports, and explain strict vs compat behaviour. Use when lodash appears in pasted or ported code, or when the user asks how a strict and a compat function differ.
argument-hint: '<lodash code, function names, or a strict vs compat question>'
allowed-tools: Read, Grep, Glob, Bash
license: MIT
---

<!-- Adapted from toss/es-toolkit es-toolkit-plugin at 159d0ce. MIT license: ../es-toolkit-LICENSE -->

# Lodash Migration and Compat Guide

Convert $ARGUMENTS using the installed es-toolkit source. This repo has no lodash dependency, so the job is to keep it out: port pasted lodash code, and never add `lodash` to fix a gap.

- **Strict (`es-toolkit`):** a simplified API for most cases. It can differ from lodash on edge cases by design, and new functions land here.
- **Compat (`es-toolkit/compat`):** aims for lodash compatibility within a [defined scope](https://es-toolkit.dev/compat/intro.html).

## Step 1: Identify the functions

List each lodash function in the input and how it's imported. Done when every one is named.

## Step 2: Check availability

Run from the repo root with the names as an exact-match pattern:

```bash
bun .claude/skills/es-toolkit-recommend/find-exports.ts '^(get|chunk|map)$'
```

A name missing from the output exists in neither build. Read the declarations for exact signatures, as in Step 3 of the `es-toolkit-recommend` skill. Done when each function has a result.

## Step 3: Choose the path

| Scenario                                   | Use                                               |
| ------------------------------------------ | ------------------------------------------------- |
| In strict, same behaviour for this call    | `@/lib/utils`                                     |
| In strict, behaviour differs for this call | Explain the difference, then pick with the user   |
| Compat-only, syntax covers it              | The syntax (`?.`, `Object.hasOwn`)                |
| Compat-only, no simple syntax              | Expose it through `utils.ts` (`es-toolkit-guide`) |
| In neither                                 | Native code, with the comment rule 6 asks for     |

es-toolkit leaves out functions that modern JavaScript replaces, which is why `get`, `set`, and `has` are compat-only.

## Step 4: Show the conversion

For each function give:

- Which build has it, and the doc link. Take the category from the declaration path, since it can differ between builds. Leave a link out if you can't confirm the page exists.
  - Strict: `https://es-toolkit.dev/reference/{category}/{fn}.html`
  - Compat: `https://es-toolkit.dev/compat/reference/{category}/{fn}.html`
- Before and after code, with the after version importing from `@/lib/utils`.
- Any behaviour difference, found by reading both `.mjs` implementations under `packages/cli/node_modules/es-toolkit/dist/`.
- For a function with options, a feature table and one line on when to use which:

| Feature | lodash | es-toolkit | es-toolkit/compat |
| ------- | ------ | ---------- | ----------------- |

End with one block showing the final imports. For many functions, use a summary table in place of the per-function detail. Done when the converted code passes `bun run lint` and `bun run typecheck`.
