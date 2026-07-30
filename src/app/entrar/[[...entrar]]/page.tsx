import { SignIn } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        appearance={clerkAppearance}
        withSignUp={false}
        fallbackRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}
