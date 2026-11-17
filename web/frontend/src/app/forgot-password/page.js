import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";
export const metadata = { title: "Password recovery" };
export default function RecoveryPage() {
  return (
    <AuthShell>
      <AuthForm mode="recovery" />
    </AuthShell>
  );
}
