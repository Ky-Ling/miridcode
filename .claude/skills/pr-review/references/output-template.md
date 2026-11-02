# Output Template

Readers should understand severity in seconds, without opening the code.

## Writing rules

| Rule                          | Description                                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Title = conclusion**        | The title is a complete conclusion sentence, so readers can set priority from it alone.                                      |
| **No reasoning process**      | Leave out how you found it. State what is wrong, why it matters, and how to fix it.                                          |
| **Decisive tone**             | If it's an issue, say so. If it's justified, omit it. Avoid "maybe" and "possibly".                                          |
| **Plain language first**      | Start with the visible symptom, then add one sentence on the technical cause.                                                |
| **Combine similar issues**    | Report a repeated pattern once, with all its locations.                                                                      |
| **Translate to future pain**  | With no visible impact today, frame `Phenomenon` as the maintenance cost, such as "the next change needs edits in 4 places". |
| **Tiered fix when relevant**  | If a small fix and a deeper fix both work, list both as `A (recommended):` and `B:`.                                         |
| **Pre-empt likely pushback**  | Add `**Counter**:` only when you can predict a specific objection.                                                           |
| **Blank line between fields** | Separate every `**Field**:` line with a blank line, or Markdown folds them into one paragraph.                               |

This is an outcome report, not an investigation log.

## Report skeleton

Keep this order. Leave out a severity section with no issues. Number issues in one sequence across all severities.

```markdown
## PR Review Report

This branch does two things:

- (A) ...
- (B) ...

**Scope**: `origin/master...HEAD`, or "uncommitted changes" (n files)

**Decision**: Approve | Approve with comments | Request changes

**Checks**: lint ✅ · typecheck ✅ · format ✅ · test ✅

### 🧭 Axis verdict

| Axis        | Result | Findings | Worst issue |
| ----------- | ------ | -------- | ----------- |
| Standards   | ✅/❌  | n        | #n or —     |
| Spec        | ✅/❌  | n        | #n or —     |
| Correctness | ✅/❌  | n        | #n or —     |

### 🔴 CRITICAL (n) — Must fix

### 🟡 WARNING (n) — Recommended before merge

### 🟢 INFO (n) — Optional optimization

### 📊 Dimension coverage

| Dimension        | Result | Issues |
| ---------------- | ------ | ------ |
| Convention       | ✅/❌  | #n, #n |
| Logic            |        |        |
| Impact           |        |        |
| Over-engineering |        |        |
| Simplicity       |        |        |
| Robustness       |        |        |
| Consistency      |        |        |
| Architecture     |        |        |
| Security         |        |        |
| Testing          |        |        |

### ✅ Passed checks (brief)

### 🔧 Next steps

1. Fix CRITICAL only.
2. Fix CRITICAL + WARNING.
3. Fix all issues.
4. Pick issue numbers to fix.
```

- **Decision:** any CRITICAL means Request changes. WARNING or INFO only means Approve with comments. No issues means Approve.
- **Axis verdict:** an axis shows ❌ when it has a CRITICAL or WARNING issue. Correctness covers what Phase 4 found on its own. A Spec row with no spec available reads "not checked", with the reason.
- **Dimension coverage:** use ✅ for clean, ❌ with issue numbers when it has findings, and "not applicable" with a short reason when it doesn't apply, such as Testing for a config change.
- **Passed checks:** name real things you verified, in three to five bullets.

## Single issue skeleton

Use this fixed order, with a blank line between fields:

```markdown
### {index}. {one-sentence conclusion}

📍 `path/to/file.ts:123` · {Standards | Spec | Correctness} · {Dimension}

**Code**: {optional, one line, a root-cause hint}

**Phenomenon**: {required, the symptom then the mechanism, or the future maintenance cost}

**Recommendation**: {required, one sentence, or two options marked `A (recommended):` and `B:`}

**Counter**: {optional, one line, only for a predictable objection}
```

For several locations, list one `📍` line each or join them with `|`. Use plain `path:line` so the terminal can open it.

Each issue has three stopping points: the title for triage, `Phenomenon` for value, and `Recommendation` for action.

Include `Code` only when the location and phenomenon don't make the root cause clear. A global change with a hidden blast radius needs it. A self-explanatory symptom doesn't.

## Full example

The issues below are illustrative.

```markdown
## PR Review Report

This branch does two things:

- (A) Adds the local `bash` and `grep` tools the agent uses to work in a project.
- (B) Adds the input bar's command menu, with keyboard selection.

**Scope**: `origin/master...HEAD` (12 files)

**Decision**: Request changes

**Checks**: lint ✅ · typecheck ✅ · format ✅ · test ✅

### 🧭 Axis verdict

| Axis        | Result | Findings | Worst issue |
| ----------- | ------ | -------- | ----------- |
| Standards   | ❌     | 1        | #2          |
| Spec        | ✅     | 0        | —           |
| Correctness | ❌     | 2        | #1          |

### 🔴 CRITICAL (1) — Must fix

### 1. A `bash` tool timeout doesn't stop the command, so the agent hangs until it finishes

📍 `packages/cli/src/lib/local-tools.ts:154` · Correctness · Robustness

**Code**: `setTimeout(() => proc.kill(), timeout)` kills only `bash`, and its children keep the pipes open.

**Phenomenon**: A 30-second timeout on `sleep 300; echo done` still takes 300 seconds, and the agent looks frozen for all of it.

**Recommendation**: Spawn with `detached: true` and kill the group with `process.kill(-proc.pid, 'SIGKILL')`.

### 🟡 WARNING (1) — Recommended before merge

### 2. `InputBar` keeps its submit logic in the component, so nothing else can reuse or test it

📍 `packages/cli/src/components/input-bar/input-bar.tsx:39` · Standards · Convention

**Phenomenon**: The next change to submit behaviour has to untangle key handling from JSX, against rule 3 in `CLAUDE.md`.

**Recommendation**: Move the handlers into `use-input-bar.ts` and pass plain props to the component.

### 🟢 INFO (1) — Optional optimization

### 3. `filterCommands` re-lowercases the query for every command

📍 `packages/cli/src/components/command-menu/utils.ts:9` · Correctness · Simplicity

**Phenomenon**: The repeated call makes a one-line filter harder to read.

**Recommendation**: Lowercase the query once before the filter.

### 📊 Dimension coverage

| Dimension        | Result         | Issues         |
| ---------------- | -------------- | -------------- |
| Convention       | ❌             | #2             |
| Logic            | ✅             |                |
| Impact           | ✅             |                |
| Over-engineering | ✅             |                |
| Simplicity       | ❌             | #3             |
| Robustness       | ❌             | #1             |
| Consistency      | ✅             |                |
| Architecture     | ✅             |                |
| Security         | ✅             |                |
| Testing          | Not applicable | UI-only change |

### ✅ Passed checks (brief)

- Tool paths stay inside the project after `realpath`.
- `grep` passes patterns with `-e`.
- `/exit` still closes the app, and Enter and Ctrl+J behave as before.

### 🔧 Next steps

1. Fix CRITICAL only.
2. Fix CRITICAL + WARNING.
3. Fix all issues.
4. Pick issue numbers to fix.
```
