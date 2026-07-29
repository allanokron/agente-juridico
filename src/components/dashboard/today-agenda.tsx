"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AgendaItem {
  id: string;
  title: string;
  time: string;
  type: string;
  client?: string;
}

interface TodayAgendaProps {
  items: AgendaItem[];
}

export function TodayAgenda({ items }: TodayAgendaProps) {
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "audiencia":
        return "bg-red-100 text-red-700";
      case "prazo":
        return "bg-amber-100 text-amber-700";
      case "reuniao":
        return "bg-blue-100 text-blue-700";
      case "protocolo":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-muted text-foreground/70";
    }
  };

  return (
    <Card className="border-border bg-white">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Agenda do Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum evento para hoje
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="text-sm font-mono text-muted-foreground w-14">
                  {item.time}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  {item.client && (
                    <p className="text-xs text-muted-foreground">{item.client}</p>
                  )}
                </div>
                <Badge variant="secondary" className={getTypeColor(item.type)}>
                  {item.type}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
