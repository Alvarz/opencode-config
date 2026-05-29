#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_PORT = 8765;
const DEFAULT_DIR = path.join(process.cwd(), ".opencode", "debug");

function usage() {
  console.log(`OpenCode debug collector

Usage:
  node skills/debug-instrumentation/scripts/debug-server.mjs [options]

Options:
  --session <name>   Session name for JSONL file. Default: debug-<timestamp>
  --port <number>   HTTP port. Default: ${DEFAULT_PORT}
  --dir <path>      Output directory. Default: .opencode/debug
  --help            Show this help

Endpoints:
  GET  /health      Return collector status
  POST /log         Append one JSON record or an array of records

Example:
  node skills/debug-instrumentation/scripts/debug-server.mjs --session checkout-race
`);
}

function parseArgs(argv) {
  const options = {
    port: DEFAULT_PORT,
    session: `debug-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    dir: DEFAULT_DIR,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--session") {
      options.session = requiredValue(argv, ++i, "--session");
    } else if (arg === "--port") {
      options.port = Number(requiredValue(argv, ++i, "--port"));
      if (!Number.isInteger(options.port) || options.port <= 0) {
        throw new Error("--port must be a positive integer");
      }
    } else if (arg === "--dir") {
      options.dir = path.resolve(requiredValue(argv, ++i, "--dir"));
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  options.session = sanitizeSession(options.session);
  return options;
}

function requiredValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function sanitizeSession(session) {
  const safe = String(session).trim().replace(/[^a-zA-Z0-9._-]/g, "-");
  if (!safe || safe === "." || safe === "..") {
    throw new Error("--session must contain at least one safe filename character");
  }
  return safe;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy(new Error("Request body too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function writeJson(response, statusCode, value) {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(`${JSON.stringify(value)}\n`);
}

function normalizeRecord(record, session) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new Error("record must be a JSON object");
  }
  return {
    ts: new Date().toISOString(),
    session,
    ...record,
  };
}

async function appendRecords(filePath, records) {
  const lines = records.map((record) => JSON.stringify(record)).join("\n");
  await fs.promises.appendFile(filePath, `${lines}\n`, "utf8");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  await fs.promises.mkdir(options.dir, { recursive: true });
  const filePath = path.join(options.dir, `${options.session}.jsonl`);

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

      if (request.method === "GET" && url.pathname === "/health") {
        writeJson(response, 200, {
          ok: true,
          session: options.session,
          file: filePath,
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/log") {
        const body = await readBody(request);
        const payload = JSON.parse(body || "{}");
        const records = (Array.isArray(payload) ? payload : [payload]).map((record) =>
          normalizeRecord(record, options.session),
        );
        await appendRecords(filePath, records);
        writeJson(response, 202, { ok: true, count: records.length, file: filePath });
        return;
      }

      writeJson(response, 404, { ok: false, error: "not found" });
    } catch (error) {
      writeJson(response, 400, { ok: false, error: error.message });
    }
  });

  server.listen(options.port, "127.0.0.1", () => {
    console.log(`OpenCode debug collector listening on http://127.0.0.1:${options.port}`);
    console.log(`Writing JSONL to ${filePath}`);
  });

  const shutdown = () => {
    server.close(() => {
      console.log("OpenCode debug collector stopped");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
