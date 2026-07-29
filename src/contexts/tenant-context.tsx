"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";

interface TenantContextType {
  empresaId: string | null;
  empresaNome: string | null;
  setEmpresa: (id: string, nome: string) => void;
}

const TenantContext = createContext<TenantContextType>({
  empresaId: null,
  empresaNome: null,
  setEmpresa: () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedEmpresa, setSelectedEmpresa] = useState<{ id: string; nome: string } | null>(null);
  const empresaId = selectedEmpresa?.id || user?.empresaId || null;
  const empresaNome = selectedEmpresa?.nome || null;

  const setEmpresa = (id: string, nome: string) => {
    setSelectedEmpresa({ id, nome });
  };

  return (
    <TenantContext.Provider value={{ empresaId, empresaNome, setEmpresa }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
