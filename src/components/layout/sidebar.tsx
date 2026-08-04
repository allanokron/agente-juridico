"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  LogOut,
  Columns,
  UserRoundSearch,
  Receipt,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Principal" },
  { label: "Gestao de Processos", href: "/gestao-processos", icon: Columns, group: "Principal" },
  { label: "Processos", href: "/processos", icon: Briefcase, group: "Principal" },
  { label: "Clientes", href: "/clientes", icon: Users, group: "Cadastro" },
  { label: "Recibos", href: "/recibos", icon: Receipt, group: "Financeiro" },
  { label: "Equipe", href: "/equipe", icon: Users, group: "Administração" },
  { label: "Configuracoes", href: "/configuracoes", icon: Settings, group: "Administração" },
];

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, group: "Principal" },
  { label: "Leads", href: "/admin/leads", icon: UserRoundSearch, group: "Comercial" },
  { label: "Empresas", href: "/admin/empresas", icon: Briefcase, group: "Gestão" },
  { label: "Usuarios", href: "/admin/usuarios", icon: Users, group: "Gestão" },
  { label: "Planos", href: "/admin/planos", icon: FileText, group: "Gestão" },
  { label: "Logs", href: "/admin/logs", icon: FileText, group: "Sistema" },
  { label: "Configuracoes", href: "/admin/configuracoes", icon: Settings, group: "Sistema" },
];

const ALMEIDA_SAKURADA_ID = "cms85ekgp000004kzu3g95rcm";

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const items = isAdmin ? adminNavItems : navItems;

  const finalItems = [...items];
  if (!isAdmin && user?.empresaId === ALMEIDA_SAKURADA_ID) {
    finalItems.push({
      label: "Recibos Exclusivos",
      href: "/recibos-asa",
      icon: Star,
      group: "Financeiro",
    });
  }

  const initials = user?.nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "??";

  const grouped = finalItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const group = item.group || "Outros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-white transition-all duration-300",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-24 items-center justify-between px-5">
          {!isCollapsed ? (
            <Link href="/dashboard" className="flex items-center w-full">
              <Image
                src="/logos/logo-horizontal.png"
                alt="LEXO"
                width={1285}
                height={304}
                className="w-full h-auto object-contain"
                priority
              />
            </Link>
          ) : (
            <Link href="/dashboard" className="flex items-center justify-center w-full">
              <Image
                src="/logos/icon.png"
                alt="LEXO"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
                priority
              />
            </Link>
          )}
        </div>

        <Separator className="bg-border" />

        {/* User info */}
        <div className={cn("border-b border-border p-4", isCollapsed && "px-2 py-4")}>
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/10">
              <AvatarImage src={user?.avatar ?? undefined} alt={user?.nome} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-foreground truncate">{user?.nome}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="mt-3 w-full justify-start gap-2 text-destructive hover:bg-destructive/5 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          )}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="mt-2 mx-auto flex h-8 w-8 text-destructive hover:bg-destructive/5 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group}>
              {!isCollapsed && (
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group}
                </p>
              )}
              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary")} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute -right-3 top-24 h-6 w-6 rounded-full border bg-white text-muted-foreground shadow-sm hover:bg-muted"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>
    </aside>
  );
}
