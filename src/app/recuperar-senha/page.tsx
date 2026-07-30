import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export default function PasswordRecoveryPage() {
  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-md">
        <PasswordRecoveryForm />
      </div>
    </AuthShell>
  );
}
