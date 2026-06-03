---
description: Cursor-style evidence-first debugging loop
agent: debug
---
Debug this bug: $ARGUMENTS

Use the `debug` agent workflow:
1. Gather expected vs actual behavior, repro steps, errors, and environment.
2. Explore relevant code.
3. Generate hypotheses.
4. Use `debug-instrumentation` to add temporary logs when runtime evidence is needed.
5. Give me the exact collector command to run from the project root, then ask me to reproduce.
6. Read `.opencode/debug/<session>.jsonl` directly once I say `reproduced`.
7. Use `debug-evidence` to identify root cause.
8. Make the smallest targeted fix.
9. Verify, then remove all `OPENCODE_DEBUG_TEMP` instrumentation.
