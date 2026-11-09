import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const port = process.env.SMOKE_PORT || "3198";
const child = spawn(process.execPath, ["--import", "tsx", "server.ts"], {
  env: {
    ...process.env,
    PORT: port,
    NODE_ENV: "production",
    ENABLE_AI: "false",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", (b) => (output += b));
child.stderr.on("data", (b) => (output += b));
try {
  for (let i = 0; i < 100 && !output.includes("Server listening"); i++) {
    if (child.exitCode !== null) throw Error(output);
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(output.includes("Server listening"), output);
  const base = `http://127.0.0.1:${port}`,
    root = await fetch(base);
  assert.equal(root.status, 200);
  const html = await root.text();
  assert.ok(html.includes('id="root"'));
  const asset = html.match(/src="([^"]+\.js)"/)[1];
  assert.equal((await fetch(new URL(asset, base))).status, 200);
  assert.equal((await fetch(base + "/api/health")).status, 200);
  assert.equal((await fetch(base + "/api/missing")).status, 404);
  const guide = await fetch(base + "/api/chronicler", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userQuestion: "What is this era?",
      era: "cognitive",
    }),
  });
  assert.equal(guide.status, 200);
  assert.equal((await guide.json()).offline, true);
  console.log(
    "Production smoke passed: root, asset, health, API 404, offline guide.",
  );
} finally {
  child.kill();
}
