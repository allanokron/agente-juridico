import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function ProtectedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) {
    const { isAuthenticated } = await auth();
    redirect(isAuthenticated ? "/acesso-negado" : "/entrar");
  }
  return children;
}
