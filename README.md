# opencode-config

Personal OpenCode configuration with local model provider settings, custom agents,
commands, skills, and a caveman plugin.

## Contents

- `opencode.json` - OpenCode config for local provider and plugin loading.
- `agents/` - Custom agent prompts.
- `commands/` - Custom command prompts.
- `skills/` - Skill instructions and helper scripts.
- `plugins/caveman/` - Local OpenCode plugin package.

## Setup

Install Node dependencies:

```sh
npm install
```

Use this folder as the OpenCode config source, or copy the relevant files into
the OpenCode config directory for the target machine.

## Local Files

The repo ignores generated dependencies and local-only state:

- `node_modules/`
- `.env` and `.env.*`
- private key and certificate files
- `.caveman-active`
- `*.bak`

Do not commit tokens, API keys, private keys, or machine-specific secrets.
