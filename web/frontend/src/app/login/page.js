import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";
import { tripAuthDestination } from "@/lib/tripPlannerNavigation";
export const metadata = { title: "Log in" };
export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  return (
    <AuthShell>
      <AuthForm mode="login" next={tripAuthDestination(next)} />
    </AuthShell>
  );
}
