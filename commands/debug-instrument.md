---
description: Add or refine temporary debug instrumentation
---
Add or refine debug instrumentation for: $ARGUMENTS

Use the `debug-instrumentation` skill. Start from explicit hypotheses, add only
temporary `OPENCODE_DEBUG_TEMP` logs, use the local collector when useful, and
return exact reproduce steps plus the expected `.opencode/debug/<session>.jsonl`
path.
