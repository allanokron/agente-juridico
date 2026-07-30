import { TaskSetupMFA } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";

export default function SetupMfaPage() {
  return (
    <AuthShell>
      <TaskSetupMFA
        appearance={clerkAppearance}
        redirectUrlComplete="/dashboard"
      />
    </AuthShell>
  );
}
