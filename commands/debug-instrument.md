---
description: Add or refine temporary debug instrumentation
agent: debug
---
Add or refine debug instrumentation for: $ARGUMENTS

Use the `debug-instrumentation` skill. Start from explicit hypotheses, add only
temporary `OPENCODE_DEBUG_TEMP` logs, use the local collector when useful, and
return exact reproduce steps plus the expected `.opencode/debug/<session>.jsonl`
path. Always include the exact collector command to run from the project root.
After I say `reproduced`, read that JSONL file directly; do not ask me to
copy/paste logs.
