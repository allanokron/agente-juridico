"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";

type RecoveryStep = "email" | "code" | "password";

type ClerkFlowError = {
  errors?: Array<{
    code?: string;
    longMessage?: string;
    message?: string;
  }>;
};

const inputClassName =
  "h-12 w-full rounded-xl border border-white/[0.12] bg-[#15151A] px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";

const buttonClassName =
  "flex h-12 w-full items-center justify-center rounded-xl bg-violet-500 px-4 font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-60";

function getErrorMessage(error: unknown, fallback: string) {
  const clerkError = (error as ClerkFlowError | null)?.errors?.[0];

  switch (clerkError?.code) {
    case "form_identifier_not_found":
      return "Não encontramos uma conta ativa com este e-mail.";
    case "form_code_incorrect":
      return "O código informado está incorreto. Confira e tente novamente.";
    case "verification_expired":
    case "form_code_expired":
      return "Este código expirou. Solicite um novo código.";
    case "form_password_length_too_short":
      return "A nova senha é muito curta.";
    case "form_password_not_strong_enough":
      return "Escolha uma senha mais forte.";
    case "form_password_pwned":
      return "Esta senha apareceu em um vazamento. Escolha outra senha.";
    default:
      return clerkError?.longMessage || clerkError?.message || fallback;
  }
}

export function PasswordRecoveryForm() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();
  const [step, setStep] = useState<RecoveryStep>("email");
  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const isLoading = fetchStatus === "fetching";

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const { error: createError } = await signIn.create({
      identifier: emailAddress.trim(),
    });

    if (createError) {
      setMessage(
        getErrorMessage(
          createError,
          "Não foi possível localizar esta conta. Confira o e-mail informado.",
        ),
      );
      return;
    }

    const { error: sendCodeError } =
      await signIn.resetPasswordEmailCode.sendCode();

    if (sendCodeError) {
      setMessage(
        getErrorMessage(
          sendCodeError,
          "Não foi possível enviar o código. Tente novamente em instantes.",
        ),
      );
      return;
    }

    setStep("code");
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const { error } = await signIn.resetPasswordEmailCode.verifyCode({
      code: code.trim(),
    });

    if (error) {
      setMessage(
        getErrorMessage(
          error,
          "Não foi possível validar o código. Confira e tente novamente.",
        ),
      );
      return;
    }

    setStep("password");
  }

  async function submitNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage("As senhas não conferem.");
      return;
    }

    const { error } =
      await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      });

    if (error) {
      setMessage(
        getErrorMessage(
          error,
          "Não foi possível salvar a nova senha. Tente novamente.",
        ),
      );
      return;
    }

    if (signIn.status === "complete") {
      const { error: finalizeError } = await signIn.finalize({
        navigate: async ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            setMessage(
              "Sua senha foi atualizada, mas existe uma verificação de segurança pendente.",
            );
            return;
          }

          const destination = decorateUrl("/dashboard");
          if (destination.startsWith("http")) {
            window.location.assign(destination);
          } else {
            router.replace(destination);
          }
        },
      });

      if (finalizeError) {
        setMessage(
          getErrorMessage(
            finalizeError,
            "A senha foi alterada, mas não foi possível iniciar a sessão. Entre novamente.",
          ),
        );
      }
      return;
    }

    if (signIn.status === "needs_second_factor") {
      setMessage(
        "Senha atualizada. Entre novamente para concluir a verificação em duas etapas.",
      );
      return;
    }

    setMessage(
      "A senha foi atualizada. Volte ao login para entrar com a nova senha.",
    );
  }

  return (
    <div className="w-full rounded-[1.4rem] border border-white/[0.08] bg-[#19191F] px-6 py-7 shadow-none sm:px-8">
      <div className="mb-7 text-center">
        <h2 className="text-2xl font-bold text-white">Recuperar senha</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {step === "email" &&
            "Informe seu e-mail para receber um código de segurança."}
          {step === "code" &&
            `Enviamos um código para ${emailAddress.trim()}.`}
          {step === "password" &&
            "Código confirmado. Agora defina sua nova senha."}
        </p>
      </div>

      {step === "email" && (
        <form onSubmit={sendCode} className="space-y-5">
          <label className="block text-sm font-semibold text-zinc-200">
            Seu e-mail
            <input
              type="email"
              autoComplete="email"
              required
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              placeholder="Digite o endereço de e-mail"
              className={`${inputClassName} mt-2`}
            />
          </label>
          <button type="submit" disabled={isLoading} className={buttonClassName}>
            {isLoading ? "Enviando..." : "Enviar código de recuperação"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode} className="space-y-5">
          <label className="block text-sm font-semibold text-zinc-200">
            Código de verificação
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Digite o código recebido"
              className={`${inputClassName} mt-2 tracking-[0.3em]`}
            />
          </label>
          <button type="submit" disabled={isLoading} className={buttonClassName}>
            {isLoading ? "Verificando..." : "Confirmar código"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCode("");
              setMessage(null);
              setStep("email");
            }}
            className="w-full text-sm font-semibold text-violet-300 hover:text-violet-200"
          >
            Usar outro e-mail
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={submitNewPassword} className="space-y-5">
          <label className="block text-sm font-semibold text-zinc-200">
            Nova senha
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua nova senha"
              className={`${inputClassName} mt-2`}
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-200">
            Confirmar nova senha
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Digite novamente a nova senha"
              className={`${inputClassName} mt-2`}
            />
          </label>
          <button type="submit" disabled={isLoading} className={buttonClassName}>
            {isLoading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      )}

      {message && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {message}
        </p>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/entrar"
          className="rounded-md px-3 py-2 text-sm font-semibold text-violet-300 underline-offset-4 hover:text-violet-200 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
