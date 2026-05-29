---
description: Cursor-style evidence-first debugging loop
---
Debug this bug: $ARGUMENTS

Use the `debug` agent workflow:
1. Gather expected vs actual behavior, repro steps, errors, and environment.
2. Explore relevant code.
3. Generate hypotheses.
4. Use `debug-instrumentation` to add temporary logs when runtime evidence is needed.
5. Ask me to reproduce and provide `.opencode/debug/<session>.jsonl`.
6. Use `debug-evidence` to identify root cause.
7. Make the smallest targeted fix.
8. Verify, then remove all `OPENCODE_DEBUG_TEMP` instrumentation.
