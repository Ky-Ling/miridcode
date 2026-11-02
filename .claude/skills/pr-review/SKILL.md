---
name: pr-review
description: Full review of a PR, branch, or uncommitted changes before merge. Combines `/code-review`'s Standards and Spec axes with a ten-dimension review, and reports in a fixed template. Use when the user asks to review a PR or check changes before merge. Use `/code-review` alone for only the two axes.
compatibility: Requires git. Works best with the gh CLI for GitHub PRs.
---

# PR Review

Act as a senior engineer reviewing a change to a terminal AI coding agent that runs model-chosen commands on the user's machine. `/code-review` supplies two independent axes, this skill adds the ten-dimension review, and every finding lands in one report.

## Constraints

- **Read-only, for every sub-agent too.** Report findings and change nothing. Reviewers may run only `bun run lint`, `bun run typecheck`, `bun run format:check`, `bun run test`, and read-only `git`.
- **No fixes.** Wait for the user's answer in Phase 7 before changing anything.
- **Scratch copies never symlink the repo's `node_modules`.** A `--fix` run follows the link and rewrites the real files.

## Workflow

Track these as you go:

```
Review progress:
- [ ] Phase 1: Pin the diff
- [ ] Phase 2: Load conventions and run checks
- [ ] Phase 3: Run the two axes
- [ ] Phase 4: Review ten dimensions
- [ ] Phase 5: Verify and grade findings
- [ ] Phase 6: Write the report
- [ ] Phase 7: Ask what to fix
```

### Phase 1: Pin the diff

The base is `origin/master`, unless the user names another branch or a PR number.

```bash
git fetch origin master
git diff origin/master...HEAD --name-only
git diff origin/master...HEAD --stat
```

For a PR number: `gh pr diff <number> --repo Ky-Ling/miridcode` and `gh pr view <number> --repo Ky-Ling/miridcode`.

If the branch diff is empty, review uncommitted work. `/code-review` stops on an empty diff, so freeze a snapshot with a temporary index, which leaves the real staging area alone:

```bash
cp .git/index <scratchpad>/review-index
GIT_INDEX_FILE=<scratchpad>/review-index git add -A
GIT_INDEX_FILE=<scratchpad>/review-index git diff --cached origin/master -- . ':(exclude)bun.lock' > <scratchpad>/review.diff
```

State in the report that it covers uncommitted changes. If there are none, say there is nothing to review and stop.

Done when you hold one fixed diff, by ref or by snapshot path, and every later phase reviews that diff.

### Phase 2: Load conventions and run checks

Read every source that applies. Each one feeds the Convention dimension:

- `CLAUDE.md`: always.
- `.oxlintrc.json` and `scripts/oxlint-plugin.js`: to see what tooling already enforces.
- `.claude/skills/*/SKILL.md`: any skill whose area the diff touches, such as `es-toolkit-*` for utilities.
- [references/quick-checklist.md](references/quick-checklist.md): the fast pass and the checks on the PR itself.

```bash
bun run lint
bun run typecheck
bun run format:check
bun run test
```

Done when you have read the sources and hold all four results, whether they pass or fail.

### Phase 3: Run the two axes

Invoke the `code-review` skill with the Skill tool. Pass these as arguments:

- The fixed point from Phase 1, or the snapshot diff path.
- The spec source: the PR body or linked issue, otherwise the user's request. For code ported from the nightcode tutorial, name the chapter's code as the behaviour reference.
- This line: "Read-only: sub-agents run no `--fix`, no formatter, no install, and no `node_modules` symlinks. This repo has no issue tracker. These reports are input to `pr-review`, which writes the final report."

Done when both the Standards and Spec reports are back. Treat them as input: Phase 6 replaces `/code-review`'s own report format.

### Phase 4: Review ten dimensions

Read each changed file in full, not just its hunks. Evaluate every dimension, using the listed axis as a starting point and never as a substitute for reading the code.

| Dimension            | Question                                                                                     | Starts from |
| -------------------- | -------------------------------------------------------------------------------------------- | ----------- |
| **Convention**       | Does it follow every rule from Phase 2, especially those lint can't check?                   | Standards   |
| **Logic**            | Does it behave correctly on edge cases, empty input, and every state transition?             | Spec        |
| **Impact**           | Does it break callers, or change anything a user would notice outside the stated scope?      | Spec        |
| **Over-engineering** | Is there redundant code, needless abstraction, or premature flexibility to remove?           | Standards   |
| **Simplicity**       | Is this the smallest clear implementation that keeps the same behaviour?                     | Standards   |
| **Robustness**       | Does it fail cleanly on rejected promises, killed processes, partial streams, and teardown?  | This phase  |
| **Consistency**      | Do naming, patterns, and error handling match within the change and with the code around it? | Standards   |
| **Architecture**     | Does the design fit established patterns, with a risk that exists today?                     | This phase  |
| **Security**         | Can untrusted input reach a shell, a file path, a log, or the model provider?                | This phase  |
| **Testing**          | Is new logic tested, and does each bug fix have a test that would have caught it?            | This phase  |

These dimensions are an internal matrix. Keep them out of issue titles.

#### Simplicity

For each new or changed function, ask in order:

1. **Dead code:** are all branches reachable and all union members used by a caller?
2. **Extract or inline:** is each extracted helper used twice? If not, inline it unless that hurts readability.
3. **Language first:** can a language or es-toolkit feature replace the manual control flow?
4. **Barrels:** does a file re-export something the consumer could import directly?
5. **Type precision:** are types wider than what callers actually pass?
6. **Single purpose:** does the function handle a case it's never called with?

#### Robustness

For each async path, hook, and subprocess:

1. **Error handling:** do all promises have a rejection path? Lint catches floating promises, not swallowed failures.
2. **Resource cleanup:** do effects that start timers, listeners, or subprocesses clean up after themselves?
3. **Async teardown:** can a late result update state after unmount or after a restart?
4. **Type safety:** can `as unknown as`, `!`, or an unvalidated `JSON.parse` be replaced with a parse or a guard?

Null checks and edge cases belong to Logic. Robustness covers what happens when something fails.

#### Consistency

1. **Naming:** does the change mix styles for one concept, such as `handleX` and `onX` for the same kind of handler?
2. **Pattern:** do similar operations use different approaches?
3. **Context:** does new code diverge from the file around it?
4. **Justified divergence:** could this code really use the existing pattern? If the shared abstraction doesn't cover the case, omit it.

#### Architecture

1. **Precedent:** search for how similar code handles this. If the change follows an established pattern, omit it.
2. **Orchestrator boundaries:** does state live in a hook, with components taking plain props?
3. **Single source of truth:** is one value kept in several forms that must stay in sync?
4. **Speculation filter:** drop anything that starts with "what if in the future".

Before reporting one, answer both: does the project already do this elsewhere, and is the risk real today? Either answer can rule it out.

#### Security

Every security finding is CRITICAL. If you're unsure whether input reaches a dangerous sink, flag it and name the path you suspect.

- **Agent tools:** paths stay inside the project after `realpath`, including symlinks and `../` globs. Patterns go in as data (`grep -e`). `replace` takes a function, so `$&` stays literal. Timeouts kill the process group. Output is capped while reading. `.env` and other secret files are denied. Tools that write or run commands need approval.
- **Secrets:** the CLI process and the commands it spawns never hold server secrets, and spawned commands get an env allowlist. Tokens and keys stay out of code, logs, and error messages.
- **Server:** auth runs before any work, request bodies have a limit, and billing happens before every early return with a unique event ID.
- **Prompt injection:** file and tool output reaching the model is data, and nothing in it can trigger a tool by itself.
- **Unsafe execution:** no `eval`, `new Function`, or shell strings built from untrusted input.

#### Testing

1. **New logic has tests**, and bug fixes have a test that would have caught the bug.
2. **Tests check behaviour**, not implementation details.
3. **Mocks are realistic**, including failures and slow responses.
4. **Removed or skipped tests** have a clear reason.

Report this dimension for business logic, following the `vitest` skill's scope. Omit it for component, style, and config changes, which stay untested.

#### Impact

When the diff does any of these, search for every reference and confirm compatibility:

- Deletes or renames an export.
- Changes a function, component, or hook signature, or a shared type.
- Changes the behaviour of a shared utility.
- Changes an API request or response format.

Then check for behaviour changes a user would notice:

1. **Defaults:** changed parameters, initial state, or renderer options such as `exitOnCtrlC`.
2. **Keys:** a key binding changed, or a key that no longer has a path in macOS Terminal, where Shift+Enter arrives as plain Enter. The app must always have a way to exit.
3. **Order and format:** sort order, filtering, or display format changed as a side effect of a refactor.
4. **Timing:** timeouts, debounce, or frame rate.
5. **Copy:** changed error messages, placeholders, or command descriptions.

A change that compiles and passes every check but alters what users see is still an Impact issue.

#### React Compiler

Code that writes to a global or reads a ref during render is skipped with no error, so it runs unoptimized. Report it under Convention.

For anti-patterns and examples, see [references/review-guide.md](references/review-guide.md).

Done when every changed file has been read in full and each dimension has findings or is clean.

### Phase 5: Verify and grade findings

A sub-agent's finding is a lead. For each one, including your own:

1. **Verify:** open the cited line and confirm the issue exists in the fixed diff. Reproduce it with a read-only command when you can, and drop what you can't confirm.
2. **Filter:** every finding needs a concrete failure or a named maintenance cost. Report what Phase 2's checks caught as one issue per check, not one per diagnostic.
3. **Merge:** report one pattern once, with all its locations. Keep the axis that found it first.
4. **Grade:**

| Severity    | Meaning                  | Examples                                                                                         |
| ----------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| 🔴 CRITICAL | Must fix before merge    | Bugs, security issues, requested behaviour missing or wrong, a failing check                     |
| 🟡 WARNING  | Recommended before merge | Broken documented rules, over-engineering, behaviour nobody asked for, real avoidable complexity |
| 🟢 INFO     | Optional                 | Fowler smells from the Standards axis, minor simplifications                                     |

Done when each finding has been verified or dropped, and has one severity, one axis, and one dimension.

### Phase 6: Write the report

Write in English, using the format and writing rules in [references/output-template.md](references/output-template.md). This template replaces `/code-review`'s own report headings. Its Axis verdict table keeps Standards, Spec, and Correctness visible separately, so no axis hides a failure in another.

Done when the report follows the template, and the Dimension coverage table has all ten rows.

### Phase 7: Ask what to fix

Ask through the question panel (AskUserQuestion): fix CRITICAL, fix CRITICAL and WARNING, fix all, or pick by number. Change nothing until the user answers.
