import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) {
    const { isAuthenticated } = await auth();
    redirect(isAuthenticated ? "/acesso-negado" : "/entrar");
  }
  if (session.role !== "SUPER_ADMIN") redirect("/dashboard");
  return children;
}
