---
name: debug-evidence
description: >
  Analyze OpenCode debug JSONL logs, map runtime evidence to hypotheses, identify
  root cause, decide whether to refine instrumentation or make a targeted fix,
  and verify cleanup. Use after Debug Mode reproduction or when inspecting
  `.opencode/debug/*.jsonl`.
---

# Debug Evidence

## Purpose

Turn collected runtime records into a root-cause decision. Prefer evidence over
speculation. If evidence is incomplete, refine instrumentation instead of guessing.

## Inputs

- Bug summary and expected vs actual behavior.
- Hypotheses from the debug agent.
- Repro steps used by the user.
- JSONL records read directly from `.opencode/debug/<session>.jsonl`.
- Any stack traces, terminal output, browser console logs, or test failures.

## Analysis Workflow

1. Read the JSONL file directly from disk. Do not ask the user to copy/paste
   collector logs. If the session is unknown, glob `.opencode/debug/*.jsonl` and
   inspect the newest plausible file; ask for a path only if ambiguous.
2. Group records by `hypothesisId`, then by `location` and `event`.
3. Build observed execution path:
   - which events happened
   - which expected events did not happen
   - values at branch points
   - timing or ordering anomalies
   - error paths and swallowed exceptions
4. Mark each hypothesis:
   - `confirmed`: logs directly support it
   - `refuted`: logs contradict it
   - `unknown`: missing evidence
5. If exactly one root cause is supported, make or recommend the smallest fix.
6. If evidence is ambiguous, request one more instrumentation pass with precise
   missing records.
7. After fix verification, confirm all `OPENCODE_DEBUG_TEMP` code is removed.

## Decision Rules

- Do not treat absence of logs as proof unless the instrumentation location was
  definitely reached or the missing event itself proves control flow.
- Prefer concrete values and ordering over narrative guesses.
- If multiple hypotheses remain plausible, add logs at the fork between them.
- If instrumentation perturbed timing, switch to lighter counters/timestamps.
- If logs include sensitive data, stop and tell the user to rotate exposed
  secrets or delete local artifacts as appropriate.

## Output

Use this shape:

```markdown
Evidence:
- H1: confirmed/refuted/unknown. <specific record facts>.
- H2: confirmed/refuted/unknown. <specific record facts>.

Root cause:
<code path + runtime fact that proves cause>

Fix:
<targeted change, or "none yet">

Verify:
<command or manual repro steps>

Cleanup:
<removed | pending | missing marker at files>
```

## Cleanup Check

Before declaring done, search for:

```text
OPENCODE_DEBUG_TEMP
```

If any match remains, remove it or report cleanup as pending.
