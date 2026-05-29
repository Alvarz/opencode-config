# Debug Snippets

Use these snippets only as temporary instrumentation. Remove all code marked
`OPENCODE_DEBUG_TEMP` after verification.

Default collector URL:

```text
http://127.0.0.1:8765/log
```

## JavaScript / TypeScript (fetch)

```ts
// OPENCODE_DEBUG_TEMP
void fetch("http://127.0.0.1:8765/log", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    hypothesisId: "H1",
    location: "src/file.ts:42",
    event: "before-save",
    data: {
      id,
      state,
    },
  }),
}).catch(() => {});
```

## Node.js (http)

```js
// OPENCODE_DEBUG_TEMP
function opencodeDebugLog(record) {
  const data = JSON.stringify(record);
  const req = require("node:http").request(
    {
      hostname: "127.0.0.1",
      port: 8765,
      path: "/log",
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(data),
      },
    },
    (res) => res.resume(),
  );
  req.on("error", () => {});
  req.end(data);
}

opencodeDebugLog({
  hypothesisId: "H1",
  location: "src/file.js:42",
  event: "before-save",
  data: { id, state },
});
```

## Python (urllib)

```python
# OPENCODE_DEBUG_TEMP
import json
import urllib.request


def opencode_debug_log(record):
    data = json.dumps(record).encode("utf-8")
    request = urllib.request.Request(
        "http://127.0.0.1:8765/log",
        data=data,
        headers={"content-type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(request, timeout=0.5).close()
    except Exception:
        pass


opencode_debug_log({
    "hypothesisId": "H1",
    "location": "src/file.py:42",
    "event": "before-save",
    "data": {"id": id, "state": state},
})
```

## Shell (curl)

```sh
# OPENCODE_DEBUG_TEMP
curl -sS -X POST http://127.0.0.1:8765/log \
  -H 'content-type: application/json' \
  -d '{"hypothesisId":"H1","location":"script.sh:42","event":"before-save","data":{"state":"pending"}}' \
  >/dev/null || true
```

## Sensitive Data

Log only fields needed to prove the hypothesis. Redact values before sending:

```ts
// OPENCODE_DEBUG_TEMP
const redacted = token ? `${token.slice(0, 4)}...redacted` : null;
```
