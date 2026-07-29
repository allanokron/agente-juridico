"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { useAuth } from "@/contexts/auth-context";

function DashboardShell({ children, isAdmin }: { children: ReactNode; isAdmin: boolean }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Sidebar isAdmin={isAdmin} />
        <div className="pl-64 transition-all duration-300">
          <Header />
          <main className="p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function DashboardLayout({ children, isAdmin = false }: { children: ReactNode; isAdmin?: boolean }) {
  return <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>;
}
