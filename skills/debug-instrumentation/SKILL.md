---
name: debug-instrumentation
description: >
  Add temporary runtime instrumentation for evidence-first debugging. Use when a
  bug needs logs, traces, timings, counters, repro evidence, or Cursor-style
  Debug Mode instrumentation with the local OpenCode debug collector.
---

# Debug Instrumentation

## Purpose

Add temporary logs that prove or disprove specific hypotheses. The agent should
collect runtime facts before fixing unclear bugs.

## Workflow

1. Define 2-5 hypotheses before editing.
2. Start collector when structured local capture is useful:

```sh
node skills/debug-instrumentation/scripts/debug-server.mjs --session <bug-name>
```

3. Read [scripts/debug-snippets.md](scripts/debug-snippets.md) and choose the
   smallest snippet that fits the runtime.
4. Add targeted instrumentation near:
   - branch points
   - async boundaries
   - external service calls
   - cache reads/writes
   - state mutations
   - error handlers
   - timing-sensitive paths
5. Ask user to reproduce with exact steps.
6. Inspect `.opencode/debug/<session>.jsonl`.
7. Remove all instrumentation after verification.

## Record Shape

Emit JSON records with this shape:

```json
{
  "ts": "2026-05-29T10:00:00.000Z",
  "session": "checkout-race",
  "hypothesisId": "H1",
  "location": "src/checkout.ts:42",
  "event": "before-save",
  "data": { "orderId": "ord_123", "state": "pending" },
  "durationMs": 12
}
```

Required fields: `hypothesisId`, `location`, `event`. The collector will add
`ts` and `session` when missing.

## Temporary Code Marker

Every instrumentation block must include this marker:

```text
OPENCODE_DEBUG_TEMP
```

Use the marker in comments where comments are idiomatic. If comments are not
appropriate, include it in the event name, for example
`"OPENCODE_DEBUG_TEMP before-save"`.

## Safety

- Never log secrets, tokens, passwords, private keys, full cookies, auth headers,
  raw payment data, or unnecessary PII.
- Redact sensitive fields before sending records.
- Keep logs low-volume. Prefer one structured event over many string logs.
- For race/timing bugs, prefer monotonic timestamps and counters over heavy I/O.
- Do not leave instrumentation in final code.

## Output

After instrumenting, tell the user:

```markdown
Instrumentation:
- H1 at <file>: captures <data>.
- H2 at <file>: captures <data>.

Run:
1. Start collector: `node skills/debug-instrumentation/scripts/debug-server.mjs --session <session>`
2. Reproduce: <steps>
3. Share log: `.opencode/debug/<session>.jsonl`
```
