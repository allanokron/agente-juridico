"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { TenantProvider } from "@/contexts/tenant-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

function DashboardShell({ children, isAdmin }: { children: ReactNode; isAdmin: boolean }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <TenantProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-[#F8FAFC]">
          <Sidebar isAdmin={isAdmin} />
          <div className="pl-64 transition-all duration-300">
            <Header />
            <main className="p-8">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </TenantProvider>
  );
}

export function DashboardLayout({ children, isAdmin = false }: { children: ReactNode; isAdmin?: boolean }) {
  return (
    <AuthProvider>
      <DashboardShell isAdmin={isAdmin}>
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
