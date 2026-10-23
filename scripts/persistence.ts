import "dotenv/config";
import { db } from "../src/lib/db";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const state = {
  total: await db.ticket.count(),
  first: await db.ticket.findFirst({
    orderBy: { number: "asc" },
    select: { id: true, title: true, number: true },
  }),
};
if (process.argv[2] === "record") {
  await writeFile(".local/persistence-check.json", JSON.stringify(state));
  console.log(`Recorded ${state.total} tickets before database restart.`);
} else {
  assert.deepEqual(
    state,
    JSON.parse(await readFile(".local/persistence-check.json", "utf8")),
  );
  console.log(
    `Verified ${state.total} tickets and the first ticket identity/title remain unchanged after database restart.`,
  );
}
await db.$disconnect();
