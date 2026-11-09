import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createApi, type AIProvider } from "./api";
async function withApi(
  run: (base: string) => Promise<void>,
  provider?: AIProvider,
  limit = 6,
) {
  const app = express();
  app.use("/api", createApi({ env: {}, provider, limit }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const address = server.address() as { port: number };
  try {
    await run(`http://127.0.0.1:${address.port}/api`);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}
const post = (base: string, path: string, body: unknown) =>
  fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
test("offline guide is useful and missing credentials never affect game health", async () =>
  withApi(async (base) => {
    assert.equal((await fetch(base + "/health")).status, 200);
    const r = await post(base, "/chronicler", {
      userQuestion: "How did farming change life?",
      era: "agricultural",
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).offline, true);
    assert.equal(
      (await post(base, "/generate-image", { prompt: "a river" })).status,
      503,
    );
    assert.equal((await post(base, "/generate-image", {})).status, 400);
    assert.equal(
      (await post(base, "/chronicler", { userQuestion: "x", era: "__proto__" }))
        .status,
      400,
    );
  }));
test("provider calls are validated, cached and bounded by rate limits", async () => {
  let calls = 0;
  const provider: AIProvider = {
    text: async () => {
      calls++;
      return "Test answer";
    },
    image: async () => {
      throw Error("secret API key should not leak");
    },
    video: async () => "",
  };
  await withApi(
    async (base) => {
      for (let i = 0; i < 2; i++)
        assert.equal(
          (
            await post(base, "/chronicler", {
              userQuestion: "Why?",
              era: "cognitive",
            })
          ).status,
          200,
        );
      assert.equal(calls, 1);
      const error = await post(base, "/generate-image", { prompt: "river" });
      assert.equal(error.status, 502);
      assert.ok(!(await error.text()).includes("secret"));
      assert.equal(
        (await post(base, "/chronicler", { userQuestion: "again" })).status,
        429,
      );
    },
    provider,
    3,
  );
});
test("cross-origin requests and disguised image bytes are rejected", async () =>
  withApi(async (base) => {
    assert.equal(
      (
        await fetch(base + "/chronicler", {
          method: "POST",
          headers: {
            Origin: "https://other.example",
            "Content-Type": "application/json",
          },
          body: "{}",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await post(base, "/animate-video", {
          imageBase64: "data:image/png;base64,aGVsbG8=",
          prompt: "move",
        })
      ).status,
      400,
    );
    const invalid = await fetch(base + "/chronicler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{oops",
    });
    assert.equal(invalid.status, 400);
  }));
