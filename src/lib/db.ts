import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as unknown as { db?: PrismaClient };
export const db =
  globalDb.db ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      ...(process.env.DATABASE_URL?.includes("127.0.0.1:54329")
        ? { max: 1 }
        : {}),
    }),
  });
if (process.env.NODE_ENV !== "production") globalDb.db = db;
