import "server-only";

export type ReadinessCheck = {
  ok: boolean;
  mode: "production" | "development" | "invalid";
  checks: {
    database: boolean;
    clerkPublishableKey: boolean;
    clerkSecretKey: boolean;
    clerkWebhook: boolean;
    canonicalUrl: boolean;
  };
};

function keyMode(value: string | undefined, livePrefix: string, testPrefix: string) {
  if (value?.startsWith(livePrefix)) return "production";
  if (value?.startsWith(testPrefix)) return "development";
  return "invalid";
}

export function getAuthConfigurationMode(): ReadinessCheck["mode"] {
  const publishable = keyMode(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    "pk_live_",
    "pk_test_"
  );
  const secret = keyMode(process.env.CLERK_SECRET_KEY, "sk_live_", "sk_test_");

  return publishable === secret ? publishable : "invalid";
}

export function getConfigurationChecks() {
  const mode = getAuthConfigurationMode();
  const checks = {
    database: Boolean(process.env.DATABASE_URL),
    clerkPublishableKey: mode === "production",
    clerkSecretKey: mode === "production",
    clerkWebhook: Boolean(process.env.CLERK_WEBHOOK_SIGNING_SECRET),
    canonicalUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
  };

  return { mode, checks };
}
