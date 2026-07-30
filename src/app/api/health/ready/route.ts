import { prisma } from "@/lib/prisma";
import {
  getConfigurationChecks,
  type ReadinessCheck,
} from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const configuration = getConfigurationChecks();
  let database = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch (error) {
    console.error("Falha na verificação de prontidão do banco:", error);
  }

  const checks = { ...configuration.checks, database };
  const response: ReadinessCheck = {
    ok: Object.values(checks).every(Boolean),
    mode: configuration.mode,
    checks,
  };

  return Response.json(response, {
    status: response.ok ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
