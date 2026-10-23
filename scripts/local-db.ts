import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { mkdir } from "node:fs/promises";
await mkdir(".local/postgres", { recursive: true });
const db = new PGlite(".local/postgres");
await db.waitReady;
const server = new PGLiteSocketServer({
  db,
  host: "127.0.0.1",
  port: 54329,
  maxConnections: 20,
});
await server.start();
console.log(
  "Development PostgreSQL-compatible database listening on 127.0.0.1:54329. Data: .local/postgres. Never expose this development server publicly.",
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  });
