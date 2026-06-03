---
description: Skeptically review a diff, file, plan, or implementation
agent: reviewer
---
Review this as a skeptical implementation reviewer: $ARGUMENTS

If no specific target is provided, review the current working tree diff. Look
for bugs, flaky logic, edge cases, scalability limits, hidden assumptions,
security risks, missing tests, and code that is too narrowly tailored. Lead with
findings by severity and propose concrete fixes. Do not edit files.
