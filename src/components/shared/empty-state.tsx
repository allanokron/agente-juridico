"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title = "Nenhum item encontrado",
  description = "Comece criando um novo item.",
  icon: Icon = FileText,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-2xl bg-primary/5 p-5 mb-5">
        <Icon className="h-8 w-8 text-primary/40" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-5 text-center max-w-sm">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
          {action.label}
        </Button>
      )}
    </div>
  );
}
