import "server-only";

import { PrismaClient } from "@prisma/client";
import { prismaDatabaseUrl } from "@/app/lib/db-server";

// singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: prismaDatabaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
