"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";

const initialForm = {
  nomeContato: "",
  escritorio: "",
  email: "",
  whatsapp: "",
  cidade: "",
  uf: "",
  tamanhoEquipe: "",
  volumeProcessos: "",
  mensagem: "",
  consentimentoLgpd: false,
  website: "",
};

export function LeadForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    const params = new URLSearchParams(window.location.search);
    const response = await fetch("/api/public/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        utmSource: params.get("utm_source") || undefined,
        utmMedium: params.get("utm_medium") || undefined,
        utmCampaign: params.get("utm_campaign") || undefined,
        utmContent: params.get("utm_content") || undefined,
        utmTerm: params.get("utm_term") || undefined,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("error");
      setMessage(result.error || "Não foi possível enviar. Tente novamente.");
      return;
    }
    setStatus("success");
    setForm(initialForm);
  }

  if (status === "success") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl bg-white p-10 text-center text-slate-900">
        <CheckCircle2 className="h-14 w-14 text-emerald-500" />
        <h3 className="mt-5 text-2xl font-extrabold">Recebemos seu contato.</h3>
        <p className="mt-3 max-w-sm leading-7 text-slate-600">
          Os dados já estão com a equipe LEXO. Entraremos em contato para conhecer melhor o seu escritório.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Seu nome" required value={form.nomeContato} onChange={(value) => setForm({ ...form, nomeContato: value })} />
        <Field label="Nome do escritório" required value={form.escritorio} onChange={(value) => setForm({ ...form, escritorio: value })} />
        <Field label="E-mail" type="email" required value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
        <Field label="Telefone / WhatsApp" required value={form.whatsapp} onChange={(value) => setForm({ ...form, whatsapp: value })} />
        <Field label="Cidade" value={form.cidade} onChange={(value) => setForm({ ...form, cidade: value })} />
        <Field label="UF" maxLength={2} value={form.uf} onChange={(value) => setForm({ ...form, uf: value.toUpperCase() })} />
        <SelectField
          label="Tamanho da equipe"
          value={form.tamanhoEquipe}
          onChange={(value) => setForm({ ...form, tamanhoEquipe: value })}
          options={["1 a 3 pessoas", "4 a 10 pessoas", "11 a 30 pessoas", "Mais de 30 pessoas"]}
        />
        <SelectField
          label="Volume de processos"
          value={form.volumeProcessos}
          onChange={(value) => setForm({ ...form, volumeProcessos: value })}
          options={["Até 100", "101 a 500", "501 a 2.000", "Mais de 2.000"]}
        />
      </div>
      <label className="mt-4 block text-sm font-bold">
        O que você gostaria de melhorar?
        <textarea
          value={form.mensagem}
          onChange={(event) => setForm({ ...form, mensagem: event.target.value })}
          rows={4}
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
        />
      </label>
      <input
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={(event) => setForm({ ...form, website: event.target.value })}
        className="absolute left-[-9999px]"
        aria-hidden="true"
      />
      <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-600">
        <input
          type="checkbox"
          required
          checked={form.consentimentoLgpd}
          onChange={(event) => setForm({ ...form, consentimentoLgpd: event.target.checked })}
          className="mt-1 h-4 w-4 accent-violet-600"
        />
        <span>
          Autorizo a LEXO a usar estes dados para entrar em contato, conforme a{" "}
          <Link href="/privacidade" className="font-bold text-violet-700 underline">
            Política de Privacidade
          </Link>.
        </span>
      </label>
      {status === "error" && <p className="mt-4 text-sm font-semibold text-red-600">{message}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 font-extrabold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        Enviar meu contato
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        type={type}
        required={required}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      >
        <option value="">Selecione</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}
