"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  onClick?: () => void;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendValue,
  className,
  onClick,
}: StatsCardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={cn(
        "text-left w-full",
        onClick && "cursor-pointer hover:bg-muted/50 transition-colors rounded-xl",
        className
      )}
      onClick={onClick}
    >
      <Card className={cn("pointer-events-none", onClick && "border-transparent shadow-none")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground/60" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
          {(description || trendValue) && (
            <p className="text-xs text-muted-foreground mt-1">
              {trendValue && (
                <span className={cn(
                  "font-semibold",
                  trend === "up" && "text-[#22C55E]",
                  trend === "down" && "text-[#EF4444]"
                )}>
                  {trend === "up" && "↑ "}
                  {trend === "down" && "↓ "}
                  {trendValue}
                </span>
              )}
              {description && <span className="ml-1">{description}</span>}
            </p>
          )}
        </CardContent>
      </Card>
    </Component>
  );
}
