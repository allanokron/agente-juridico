import type { NextConfig } from "next";

if (process.env.VERCEL_ENV === "production") {
  const required = [
    "DATABASE_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "CLERK_WEBHOOK_SIGNING_SECRET",
    "NEXT_PUBLIC_SITE_URL",
  ] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());
  const invalidClerkKeys =
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_live_") ||
    !process.env.CLERK_SECRET_KEY?.startsWith("sk_live_");

  if (missing.length || invalidClerkKeys) {
    const reasons = [
      ...(missing.length ? [`variáveis ausentes: ${missing.join(", ")}`] : []),
      ...(invalidClerkKeys ? ["as chaves do Clerk não são live"] : []),
    ];
    throw new Error(`Configuração de produção inválida: ${reasons.join("; ")}.`);
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
