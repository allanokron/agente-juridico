import Image from "next/image";

function LexoBrand() {
  return (
    <div className="auth-brand relative w-full max-w-[250px] sm:max-w-[280px]">
      <Image
        src="/logos/logo-horizontal-transparent.png"
        alt="LEXO — Prazos. Processos. Pessoas."
        width={2048}
        height={683}
        className="h-auto w-full object-contain brightness-0 invert"
        priority
      />
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell relative flex min-h-svh overflow-hidden bg-[#141419] px-4 py-10 text-white sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(139,92,246,0.12),transparent_30%),linear-gradient(180deg,#1B1B21_0%,#15151A_52%,#101015_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:64px_64px]"
      />

      <div aria-hidden="true" className="auth-circuit auth-circuit-left">
        <span /><span /><span />
      </div>
      <div aria-hidden="true" className="auth-circuit auth-circuit-right">
        <span /><span /><span />
      </div>

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center justify-center">
        <header className="mb-8 max-w-2xl text-center sm:mb-10">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-violet-300">
            Ambiente seguro LEXO
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Acesse sua gestão jurídica
          </h1>
        </header>

        <section className="auth-frame relative flex w-full max-w-[520px] flex-col items-center rounded-[2rem] border border-white/[0.09] bg-[#19191F]/95 px-4 pb-4 pt-7 shadow-[0_32px_100px_-34px_rgba(0,0,0,.95)] sm:px-6 sm:pt-8">
          <div aria-hidden="true" className="auth-logo-glow" />
          <div className="relative mb-6 w-full max-w-md overflow-hidden rounded-[1.4rem] border border-white/[0.08] bg-white/[0.035] px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] sm:px-8">
            <div className="flex w-full justify-center">
              <LexoBrand />
            </div>
          </div>

          <div className="relative z-10 flex w-full justify-center">{children}</div>
        </section>
      </div>
    </main>
  );
}

export const clerkAppearance = {
  variables: {
    colorPrimary: "#8B5CF6",
    colorNeutral: "#FFFFFF",
    colorBackground: "#19191F",
    colorForeground: "#F4F4F5",
    colorMuted: "#202027",
    colorMutedForeground: "#A1A1AA",
    colorInput: "#15151A",
    colorInputForeground: "#FAFAFA",
    colorBorder: "rgba(255,255,255,0.12)",
    colorRing: "#8B5CF6",
    colorShadow: "#000000",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "mx-auto w-full max-w-md",
    cardBox:
      "mx-auto w-full overflow-hidden rounded-[1.4rem] border border-white/[0.08] bg-[#19191F] shadow-none",
    card: "w-full border-0 bg-[#19191F] px-1 sm:px-2",
    socialButtonsBlockButton: { display: "none" },
    dividerRow: { display: "none" },
    footerAction: { display: "none" },
    headerTitle: "text-white",
    headerSubtitle: "text-zinc-400",
    formFieldLabel: "text-zinc-200",
    formFieldInputShowPasswordButton: "text-zinc-400 hover:text-white",
    identityPreviewText: "text-zinc-200",
    identityPreviewEditButton: "text-violet-400 hover:text-violet-300",
    footer: "border-t border-white/[0.07] bg-[#17171C]",
    footerActionLink: "text-violet-400 hover:text-violet-300",
    formFieldInput:
      "border-white/[0.12] bg-[#15151A] text-white shadow-none placeholder:text-zinc-600 focus:border-violet-500 focus:ring-violet-500/20",
    formButtonPrimary:
      "bg-violet-500 text-white hover:bg-violet-400 shadow-lg shadow-violet-950/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400",
  },
} as const;
