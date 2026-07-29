"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/sidebar-context";
import { useTenant } from "@/contexts/tenant-context";

export function Header() {
  const { toggleSidebar } = useSidebar();
  const { empresaNome } = useTenant();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-white/80 backdrop-blur-sm px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5 text-muted-foreground" />
      </Button>

      <div className="flex items-center gap-2">
        {empresaNome && (
          <span className="text-sm font-medium text-muted-foreground">{empresaNome}</span>
        )}
      </div>

      <div className="flex-1" />

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#8B5CF6] text-[10px] font-semibold text-white flex items-center justify-center">
          3
        </span>
      </Button>
    </header>
  );
}
