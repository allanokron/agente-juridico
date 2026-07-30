import { SignOutButton } from "@clerk/nextjs";
import { ShieldX } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1120] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <ShieldX className="mx-auto h-12 w-12 text-violet-600" />
        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Acesso não liberado
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sua identidade foi confirmada, mas não existe um convite ativo do
          escritório para este e-mail. Solicite acesso ao administrador da
          equipe.
        </p>
        <SignOutButton redirectUrl="/entrar">
          <button className="mt-6 h-11 w-full rounded-xl bg-violet-600 font-semibold text-white hover:bg-violet-700">
            Sair e usar outra conta
          </button>
        </SignOutButton>
      </div>
    </main>
  );
}
