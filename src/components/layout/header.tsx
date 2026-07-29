"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/sidebar-context";
import { useTenant } from "@/contexts/tenant-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Notification = {
  id: string;
  titulo: string;
  mensagem?: string | null;
  link?: string | null;
  lida: boolean;
  createdAt: string;
};

export function Header() {
  const { toggleSidebar } = useSidebar();
  const { empresaNome } = useTenant();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/notificacoes");
    if (response.ok) setNotifications(await response.json());
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const openNotification = async (notification: Notification) => {
    await fetch("/api/notificacoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notification.id }),
    });
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, lida: true } : item))
    );
    if (notification.link) router.push(notification.link);
  };

  const unread = notifications.filter((notification) => !notification.lida).length;

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

      <Popover>
        <PopoverTrigger
          render={
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8B5CF6] px-1 text-[10px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          }
        />
        <PopoverContent align="end" className="w-80 p-0">
          <div className="border-b p-3 text-sm font-semibold">Notificações</div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-5 text-center text-sm text-muted-foreground">Nenhuma notificação.</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => openNotification(notification)}
                  className={`block w-full border-b p-3 text-left hover:bg-muted ${notification.lida ? "opacity-60" : "bg-primary/5"}`}
                >
                  <p className="text-sm font-medium">{notification.titulo}</p>
                  {notification.mensagem && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.mensagem}</p>}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </header>
  );
}
