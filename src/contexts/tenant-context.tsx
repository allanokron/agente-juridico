"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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
  const [empresaId, setEmpresaId] = useState<string | null>("empresa-1");
  const [empresaNome, setEmpresaNome] = useState<string | null>("Silva & Associados");

  const setEmpresa = (id: string, nome: string) => {
    setEmpresaId(id);
    setEmpresaNome(nome);
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
