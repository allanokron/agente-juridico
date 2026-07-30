import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  MessageCircle,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { LeadForm } from "@/components/marketing/lead-form";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";

export const metadata: Metadata = {
  title: "LEXO | Gestão inteligente para escritórios de advocacia",
  description:
    "Organize processos, prazos, documentos e equipes em uma plataforma jurídica criada para acelerar a gestão do seu escritório de advocacia.",
  keywords: [
    "software jurídico",
    "gestão de processos jurídicos",
    "controle de prazos",
    "automação para escritórios de advocacia",
    "gestão de escritório de advocacia",
    "sistema para advogados",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "LEXO — Prazos. Processos. Pessoas.",
    description:
      "Gestão jurídica organizada, conectada e inteligente para escritórios de advocacia.",
    url: siteUrl,
    siteName: "LEXO",
    locale: "pt_BR",
    type: "website",
  },
};

const pillars = [
  {
    icon: Clock3,
    title: "Organização",
    text: "Controle inteligente de prazos, tarefas e compromissos importantes.",
  },
  {
    icon: FolderKanban,
    title: "Gestão",
    text: "Processos organizados, visualmente claros e sempre acessíveis.",
  },
  {
    icon: Users,
    title: "Pessoas",
    text: "Equipe alinhada para dedicar mais tempo ao cliente e à estratégia.",
  },
  {
    icon: MessageCircle,
    title: "Conexão",
    text: "Informação centralizada para uma rotina mais fluida e colaborativa.",
  },
  {
    icon: Bot,
    title: "Inteligência",
    text: "Uma plataforma que simplifica a rotina e prepara o escritório para evoluir.",
  },
];

const capabilities = [
  {
    icon: FolderKanban,
    title: "Gestão visual de processos",
    text: "Acompanhe cada processo por etapa, responsável, prioridade e data.",
  },
  {
    icon: CalendarCheck,
    title: "Agenda e prazos",
    text: "Centralize audiências, reuniões, revisões e compromissos jurídicos.",
  },
  {
    icon: FileText,
    title: "Documentos no processo",
    text: "Mantenha arquivos, observações e histórico dentro do contexto correto.",
  },
  {
    icon: ShieldCheck,
    title: "Equipe e permissões",
    text: "Defina responsabilidades e acessos sem misturar dados entre escritórios.",
  },
];

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LEXO",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Plataforma de gestão jurídica para processos, prazos, documentos e equipes.",
    url: siteUrl,
    audience: {
      "@type": "Audience",
      audienceType: "Escritórios de advocacia e advogados",
    },
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="LEXO — início" className="w-40 sm:w-48">
            <Image
              src="/logos/logo-horizontal.png"
              alt="LEXO — Prazos. Processos. Pessoas."
              width={1285}
              height={304}
              className="h-auto w-full"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#solucao" className="hover:text-violet-700">A solução</a>
            <a href="#recursos" className="hover:text-violet-700">Recursos</a>
            <a href="#contato" className="hover:text-violet-700">Quero saber mais</a>
          </nav>
          <Link
            href="/entrar"
            className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-800 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
          >
            Entrar
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#080F20] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(139,92,246,0.28),transparent_30%),radial-gradient(circle_at_82%_65%,rgba(99,102,241,0.16),transparent_32%),linear-gradient(135deg,#080F20,#111B36_55%,#090F20)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-32">
          <div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
              Transforme a gestão do seu escritório em uma operação{" "}
              <span className="bg-gradient-to-r from-violet-300 to-violet-500 bg-clip-text text-transparent">
                mais ágil, organizada e inteligente.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              A LEXO reúne processos, prazos, documentos e equipe em um único
              ambiente. Menos dispersão, mais clareza para cuidar da estratégia
              e dos clientes.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contato"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-violet-600 px-7 font-bold text-white shadow-xl shadow-violet-950/40 transition hover:bg-violet-500"
              >
                Quero saber mais <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#solucao"
                className="inline-flex h-13 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 font-bold text-white transition hover:bg-white/10"
              >
                Conhecer a LEXO
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-10 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
              <div className="grid gap-4 sm:grid-cols-2">
                {capabilities.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-[#101A33]/85 p-5">
                    <item.icon className="h-6 w-6 text-violet-300" />
                    <p className="mt-4 font-bold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="solucao" className="scroll-mt-20 px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-sm font-extrabold uppercase tracking-[.2em] text-violet-700">O conceito LEXO</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
              Equilíbrio entre o que vence, o que avança e quem faz acontecer.
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              A marca nasce de três elementos essenciais da advocacia: prazos,
              processos e pessoas. Justiça, organização e inteligência trabalhando juntas.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-5">
            {pillars.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-violet-200 hover:bg-white hover:shadow-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-extrabold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="recursos" className="scroll-mt-20 bg-slate-50 px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2">
          <div>
            <span className="text-sm font-extrabold uppercase tracking-[.2em] text-violet-700">Uma rotina mais fluida</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
              Informação jurídica no lugar certo, na hora certa.
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              A LEXO reduz controles paralelos e dá visibilidade ao trabalho do
              escritório sem sacrificar segurança ou autonomia.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              "Centralização de processos, documentos e histórico.",
              "Controle visual das etapas e responsabilidades.",
              "Agenda compartilhada para prazos, audiências e reuniões.",
              "Ambiente exclusivo para cada escritório e sua equipe.",
              "Base organizada para uma gestão cada vez mais inteligente.",
            ].map((item) => (
              <div key={item} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-violet-600" />
                <p className="font-semibold leading-7 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="scroll-mt-20 px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-14 rounded-[2rem] bg-[#0B1428] p-7 text-white sm:p-12 lg:grid-cols-[.85fr_1.15fr] lg:p-16">
          <div>
            <Scale className="h-10 w-10 text-violet-400" />
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">
              Quer organizar e acelerar a gestão do seu escritório?
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Conte um pouco sobre sua operação. O contato entra diretamente
              no nosso atendimento para entendermos como a LEXO pode ajudar.
            </p>
          </div>
          <LeadForm />
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-7 sm:flex-row">
          <Image src="/logos/logo-horizontal.png" alt="LEXO" width={190} height={45} className="h-auto w-44" />
          <div className="flex gap-6 text-sm font-semibold text-slate-500">
            <Link href="/privacidade" className="hover:text-violet-700">Privacidade</Link>
            <Link href="/termos" className="hover:text-violet-700">Termos</Link>
            <Link href="/entrar" className="hover:text-violet-700">Entrar</Link>
          </div>
          <div className="flex items-center gap-3 border-slate-200 text-slate-400 sm:border-l sm:pl-7">
            <span className="whitespace-nowrap text-right text-[10px] font-semibold uppercase tracking-[.14em]">
              Uma empresa do
            </span>
            <Image
              src="/logos/grupo-nexiva.png"
              alt="Grupo Nexiva"
              width={1069}
              height={306}
              className="h-auto w-28 opacity-90"
            />
          </div>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} LEXO</p>
        </div>
      </footer>
    </main>
  );
}
