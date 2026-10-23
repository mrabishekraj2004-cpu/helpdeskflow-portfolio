import { randomBytes } from "node:crypto";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
if (existsSync(".env")) {
  console.log(".env already exists; preserved.");
  process.exit(0);
}
mkdirSync(".local", { recursive: true });
writeFileSync(
  ".env",
  `DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54329/postgres?sslmode=disable"\nBETTER_AUTH_SECRET="${randomBytes(40).toString("hex")}"\nBETTER_AUTH_URL="http://127.0.0.1:3000"\nDEMO_MODE="false"\n`,
);
console.log(
  "Created ignored .env with a random session secret. Start npm run db:local in a separate terminal.",
);
