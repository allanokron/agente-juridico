import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso | LEXO",
  description: "Termos aplicáveis ao uso dos canais públicos da LEXO.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-16">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <Link href="/" className="text-sm font-bold text-violet-700">← Voltar para a LEXO</Link>
        <h1 className="mt-8 text-4xl font-extrabold">Termos de Uso</h1>
        <div className="mt-8 space-y-5 leading-8 text-slate-600 [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-slate-900">
          <p>Estes termos regulam o uso da página pública e dos canais de contato da LEXO. O acesso ao sistema de gestão depende de convite e credenciais individuais.</p>
          <h2>Uso adequado</h2>
          <p>O usuário deve fornecer informações verdadeiras e não utilizar os canais para atividades ilícitas, abusivas ou que prejudiquem a disponibilidade do serviço.</p>
          <h2>Propriedade intelectual</h2>
          <p>A marca, os textos, elementos visuais e o software da LEXO são protegidos e não podem ser reproduzidos sem autorização.</p>
          <h2>Disponibilidade</h2>
          <p>A LEXO poderá realizar melhorias, atualizações e manutenções necessárias à segurança e evolução da plataforma.</p>
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Este texto deve passar por revisão jurídica antes do lançamento público definitivo.</p>
        </div>
      </article>
    </main>
  );
}
