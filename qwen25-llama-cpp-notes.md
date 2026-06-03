# Qwen 2.5 Coder With OpenCode and llama.cpp

This note documents the fix for OpenCode not being able to read repo files such as `AGENTS.md` when using the local Qwen 2.5 Coder model through `llama-server`.

## Problem

In `/Users/carlosalvares/projects/server/infrastructure`, asking OpenCode:

```text
can you read the AGENTS.md?
```

returned:

```text
I'm sorry, but I don't have access to the AGENTS.md file.
```

The file existed and OpenCode was running in the correct project directory. The issue was that llama.cpp was not running with the Jinja chat template mode needed for tool calling.

## Changes Made

### `/Users/carlosalvares/.zshrc`

The `qwen25` alias was changed from:

```sh
--chat-template chatml \
```

to:

```sh
--jinja \
```

The resulting alias is:

```sh
alias qwen25='llama-server \
  -m ~/models/qwen2.5-coder-7b/qwen2.5-coder-7b-instruct-q5_k_m.gguf \
  -a qwen2.5-coder-7b-instruct \
  -c 32768 \
  -ngl 999 \
  --jinja \
  --host 127.0.0.1 \
  --port 1234'
```

### `/Users/carlosalvares/.config/opencode/opencode.json`

The default model was changed from:

```json
"model": "qwen2.5-coder-7b-instruct"
```

to:

```json
"model": "llama.cpp/qwen2.5-coder-7b-instruct"
```

OpenCode expects model names in `provider/model` form.

## Verification

Start or restart the local model server:

```sh
source ~/.zshrc
qwen25
```

Confirm llama.cpp is reachable:

```sh
curl http://127.0.0.1:1234/health
```

Expected response:

```json
{"status":"ok"}
```

Confirm the server reports tool-call-capable chat template support:

```sh
curl http://127.0.0.1:1234/props
```

Look for:

```json
"supports_tool_calls": true
```

Then run OpenCode from the repo root in a fresh session:

```sh
cd /Users/carlosalvares/projects/server/infrastructure
opencode
```

Ask:

```text
can you read the AGENTS.md?
```

Expected behavior: OpenCode should call its `read` tool and answer using the contents of `AGENTS.md`.

## Known Note

Continuing an old OpenCode session may preserve the previous failed behavior. Start a new OpenCode session after changing the llama.cpp launch flags.

## Adding Additional Local Models

llama.cpp serves one loaded model per `llama-server` process. To add another local model to this OpenCode pipeline, run another `llama-server` instance on a different port and add a matching provider entry to `opencode.json`.

## Rejected Qwen3-Coder 30B A3B Route

The attempted local Qwen3-Coder upgrade route used:

- Model file: `/Users/carlosalvares/models/qwen3-coder-30b-a3b/Qwen3-Coder-30B-A3B-Instruct-UD-IQ2_M.gguf`
- Removed shell alias: `qwen3coder`
- llama.cpp alias: `qwen3-coder-30b-a3b-instruct`
- Local API: `http://127.0.0.1:1235/v1`
- Removed OpenCode model: `llama.cpp-qwen3coder/qwen3-coder-30b-a3b-instruct`
- Context: `16384`

Do not use this route on the 16 GB M1 Pro. Starting it with Metal offload (`-ngl 999`) and `16k` context caused a Mac reboot during model load. llama.cpp projected about 12 GB of device memory against a 12.7 GB recommended Metal working set, leaving too little headroom for macOS and other processes.

The existing Qwen 2.5 route remains available as:

```sh
qwen25
opencode --model llama.cpp/qwen2.5-coder-7b-instruct
```

## Added Qwen2.5-Coder 7B Q6 Test Route

The conservative quality upgrade route uses the same Qwen2.5-Coder 7B model family as the working default, but with a higher-quality `Q6_K` quantization.

- Model file: `/Users/carlosalvares/models/qwen2.5-coder-7b/qwen2.5-coder-7b-instruct-q6_k.gguf`
- Shell alias: `qwen25_q6`
- llama.cpp alias: `qwen2.5-coder-7b-instruct-q6`
- Local API: `http://127.0.0.1:1235/v1`
- OpenCode model: `llama.cpp-qwen25-q6/qwen2.5-coder-7b-instruct-q6`
- Context: `32768`
- Slots: `1`

Start it in a new terminal:

```sh
source ~/.zshrc
qwen25_q6
```

Use it from this repo:

```sh
opencode --model llama.cpp-qwen25-q6/qwen2.5-coder-7b-instruct-q6
```

Test result from this repo:

- Direct chat answered `4` correctly in about `0.35s`.
- OpenCode read `AGENTS.md` with a real `read` tool call and replied `# Gemini Infrastructure Project Overview`.
- OpenCode sent `11647` input tokens for the first agent step.
- llama.cpp prompt eval for that step was about `188.91` tokens/sec and took about `63.9s` total.
- The follow-up response after tool output reused most of the prompt and took about `1.1s`.

The route was raised from `16k` to `32k` context after OpenCode produced:

```text
request (17768 tokens) exceeds the available context size (16384 tokens), try increasing it
```

Keep `-np 1`; increasing parallel slots multiplies KV cache memory.

### 1. Add a new shell alias

Add another alias to `/Users/carlosalvares/.zshrc`. Use a unique port and model alias.

Example:

```sh
alias local_coder_alt='llama-server \
  -m ~/models/example-coder/example-coder.gguf \
  -a example-coder-instruct \
  -c 32768 \
  -ngl 999 \
  --jinja \
  --host 127.0.0.1 \
  --port 1235'
```

Keep `--jinja` when the model should use OpenCode tools such as `read`, `grep`, `glob`, `bash`, and `edit`.

### 2. Add a provider to OpenCode

Edit `/Users/carlosalvares/.config/opencode/opencode.json` and add a new provider entry that points at the new port.

Example:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-plugin-llama.cpp@latest"],
  "provider": {
    "llama.cpp": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "llama.cpp (local)",
      "options": {
        "baseURL": "http://127.0.0.1:1234/v1"
      },
      "models": {
        "qwen2.5-coder-7b-instruct": {}
      }
    },
    "llama.cpp-alt": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "llama.cpp alternate local model",
      "options": {
        "baseURL": "http://127.0.0.1:1235/v1"
      },
      "models": {
        "example-coder-instruct": {}
      }
    }
  },
  "model": "llama.cpp/qwen2.5-coder-7b-instruct"
}
```

The provider key and model name are what you use with OpenCode:

```sh
opencode --model llama.cpp-alt/example-coder-instruct
```

To make the new model the default, change:

```json
"model": "llama.cpp/qwen2.5-coder-7b-instruct"
```

to:

```json
"model": "llama.cpp-alt/example-coder-instruct"
```

### 3. Start and verify the new model

Reload the shell config and start the new server:

```sh
source ~/.zshrc
local_coder_alt
```

Check health:

```sh
curl http://127.0.0.1:1235/health
```

Check that OpenCode will see the model id:

```sh
curl http://127.0.0.1:1235/v1/models
```

Check tool-call support:

```sh
curl http://127.0.0.1:1235/props
```

Look for:

```json
"supports_tool_calls": true
```

### 4. Use the model in OpenCode

Start OpenCode with the new provider/model:

```sh
cd /Users/carlosalvares/projects/server/infrastructure
opencode --model llama.cpp-alt/example-coder-instruct
```

Then test file access:

```text
can you read the AGENTS.md?
```

Expected behavior: the model should call OpenCode's `read` tool and answer from the file contents.

### Notes

Use a different port for each running `llama-server` process.

The model alias passed with `-a` should match the model name configured in OpenCode.

If `/props` does not report `"supports_tool_calls": true`, OpenCode may still chat with the model, but tool usage can fail or degrade into refusal text.

Start a fresh OpenCode session after adding or switching local models.
