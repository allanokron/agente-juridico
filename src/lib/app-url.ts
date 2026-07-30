import "server-only";

const LOCAL_APP_URL = "http://localhost:3010";

export function getAppUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL é obrigatória em produção para gerar URLs seguras."
    );
  }

  return LOCAL_APP_URL;
}

export function getInvitationRedirectUrl() {
  return `${getAppUrl()}/cadastro`;
}
