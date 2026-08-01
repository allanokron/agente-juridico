import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { ClerkProvider } from "@clerk/nextjs";
import { lexoPtBR } from "@/lib/clerk-localization";
import { Toaster } from "sonner";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "LEXO - Agente Juridico Inteligente",
  description: "Prazos. Processos. Pessoas. Sistema de gestao juridica inteligente para escritorios de advocacia.",
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <ClerkProvider
          localization={lexoPtBR}
          signInUrl="/entrar"
          signUpUrl="/cadastro"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          taskUrls={{ "setup-mfa": "/tarefas/configurar-mfa" }}
        >
          <AppProviders>{children}</AppProviders>
          <Toaster richColors position="top-right" />
        </ClerkProvider>
      </body>
    </html>
  );
}
