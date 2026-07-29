"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecentProcess {
  id: string;
  number: string;
  client: string;
  type: string;
  status: string;
  updatedAt: string;
}

interface RecentProcessesProps {
  processes: RecentProcess[];
}

export function RecentProcesses({ processes }: RecentProcessesProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ativo":
        return "bg-emerald-100 text-emerald-700";
      case "suspenso":
        return "bg-amber-100 text-amber-700";
      case "arquivado":
        return "bg-muted text-foreground/70";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <Card className="border-border bg-white">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Últimos Processos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {processes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum processo encontrado
          </p>
        ) : (
          <div className="space-y-2">
            {processes.map((process) => (
              <div
                key={process.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {process.number || "Sem número"}
                  </p>
                  <p className="text-xs text-muted-foreground">{process.client}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={getStatusColor(process.status)}>
                    {process.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground/60">{process.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
