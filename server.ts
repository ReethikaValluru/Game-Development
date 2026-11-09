import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApi } from "./src/server/api";
dotenv.config();
const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable("x-powered-by");
// Keep proxy trust disabled unless an explicitly trusted proxy topology is configured.
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});
app.use("/api", createApi());
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Unknown API route." }),
);
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(root, "dist")));
    app.get("*", (_req, res) =>
      res.sendFile(path.join(root, "dist", "index.html")),
    );
  }
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, "0.0.0.0", () =>
    console.log(`Server listening on port ${port}`),
  );
  const stop = () => server.close(() => process.exit(0));
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
}
start().catch(() => {
  console.error("Server startup failed. Check configuration and build output.");
  process.exitCode = 1;
});
