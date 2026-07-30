"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth as useClerkAuth, useClerk } from "@clerk/nextjs";

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  empresaId: string;
  avatar?: string | null;
  cargo?: {
    id: string;
    nome: string;
    permissoes: unknown;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const clerkAuth = useClerkAuth();
  const clerk = useClerk();
  const [loadedUser, setLoadedUser] = useState<User | null>(null);
  const [resolvedClerkUserId, setResolvedClerkUserId] = useState<string | null>(null);
  const user = clerkAuth.isSignedIn ? loadedUser : null;
  const loading =
    !clerkAuth.isLoaded ||
    Boolean(
      clerkAuth.isSignedIn && resolvedClerkUserId !== clerkAuth.userId
    );

  useEffect(() => {
    if (!clerkAuth.isLoaded || !clerkAuth.isSignedIn || !clerkAuth.userId) return;

    let active = true;
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!active) return;
        setLoadedUser(response.ok ? await response.json() : null);
      })
      .catch(() => active && setLoadedUser(null))
      .finally(() => active && setResolvedClerkUserId(clerkAuth.userId));
    return () => {
      active = false;
    };
  }, [clerkAuth.isLoaded, clerkAuth.isSignedIn, clerkAuth.userId]);

  const setUser = useCallback((u: User | null) => {
    setLoadedUser(u);
  }, []);

  const logout = useCallback(async () => {
    await clerk.signOut({ redirectUrl: "/entrar" });
    setLoadedUser(null);
    setResolvedClerkUserId(null);
    router.refresh();
  }, [clerk, router]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
