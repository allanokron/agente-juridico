import "server-only";

import { getSessionUser } from "@/lib/auth";

export async function getSuperAdmin() {
  const user = await getSessionUser();
  return user?.role === "SUPER_ADMIN" ? user : null;
}
