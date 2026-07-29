"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle, Calendar } from "lucide-react";

interface DeadlineItem {
  id: string;
  title: string;
  processNumber?: string;
  date: string;
  time?: string;
  type: "prazo" | "audiencia" | "reuniao";
  priority: "alta" | "media" | "baixa";
}

interface UpcomingDeadlinesProps {
  deadlines: DeadlineItem[];
  title?: string;
}

export function UpcomingDeadlines({ deadlines, title = "Próximos Prazos" }: UpcomingDeadlinesProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "bg-red-100 text-red-700";
      case "media":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-muted text-foreground/70";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "prazo":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "audiencia":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "reuniao":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <Card className="border-border bg-white">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum prazo próximo
          </p>
        ) : (
          <div className="space-y-3">
            {deadlines.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="mt-0.5">{getTypeIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  {item.processNumber && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.processNumber}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {item.date}
                      {item.time && ` às ${item.time}`}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className={getPriorityColor(item.priority)}>
                  {item.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
