import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade | LEXO",
  description: "Saiba como a LEXO trata dados pessoais e contatos comerciais.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidade">
      <p>A LEXO coleta os dados enviados voluntariamente em seus formulários para responder solicitações comerciais, conhecer as necessidades do escritório e manter o histórico do atendimento.</p>
      <h2>Dados tratados</h2>
      <p>Podemos tratar nome, escritório, e-mail, telefone, cidade, tamanho da equipe, volume aproximado de processos e a mensagem enviada.</p>
      <h2>Finalidade e retenção</h2>
      <p>Os dados são usados para contato comercial e gestão do relacionamento. Eles são mantidos pelo período necessário à finalidade ou ao cumprimento de obrigações legais.</p>
      <h2>Compartilhamento e segurança</h2>
      <p>Não comercializamos dados pessoais. Utilizamos fornecedores de infraestrutura e autenticação necessários à operação, com controles de acesso e segurança compatíveis.</p>
      <h2>Seus direitos</h2>
      <p>Você pode solicitar confirmação, acesso, correção, exclusão ou revogação do consentimento pelos canais oficiais da LEXO.</p>
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Este texto deve passar por revisão jurídica antes do lançamento público definitivo.</p>
    </LegalPage>
  );
}

function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-16">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <Link href="/" className="text-sm font-bold text-violet-700">← Voltar para a LEXO</Link>
        <h1 className="mt-8 text-4xl font-extrabold">{title}</h1>
        <div className="mt-8 space-y-5 leading-8 text-slate-600 [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-slate-900">{children}</div>
      </article>
    </main>
  );
}
