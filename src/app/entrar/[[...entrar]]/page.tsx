import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";

type SignInPageProps = {
  params: Promise<{ entrar?: string[] }>;
};

export default async function SignInPage({ params }: SignInPageProps) {
  const { entrar = [] } = await params;
  const isInitialStep = entrar.length === 0;

  return (
    <AuthShell>
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
        <SignIn
          appearance={clerkAppearance}
          path="/entrar"
          routing="path"
          withSignUp={false}
          fallbackRedirectUrl="/dashboard"
        />

        {isInitialStep && (
          <Link
            href="/entrar/forgot-password"
            className="rounded-md px-3 py-2 text-sm font-semibold text-violet-300 underline-offset-4 transition-colors hover:text-violet-200 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
          >
            Esqueci minha senha
          </Link>
        )}
      </div>
    </AuthShell>
  );
}
