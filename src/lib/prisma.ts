import { PrismaClient } from "../../prisma/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  let databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined");
  }
  
  // Strip any surrounding quotes (dotenv parsing issue)
  databaseUrl = databaseUrl.replace(/^["']|["']$/g, "");
  
  // Convert mysql:// to mariadb:// for the adapter
  let mariaDbUrl = databaseUrl;
  if (mariaDbUrl.startsWith("mysql://")) {
    mariaDbUrl = "mariadb://" + mariaDbUrl.substring(8);
  }
  
  // Ensure there's a colon for password even if empty: mariadb://user@host -> mariadb://user:@host
  if (!mariaDbUrl.includes(":@") && !mariaDbUrl.match(/\/\/[^@]*:[^@]*@/)) {
    mariaDbUrl = mariaDbUrl.replace(/@/, ":@");
  }
  
  const adapter = new PrismaMariaDb(mariaDbUrl);
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
