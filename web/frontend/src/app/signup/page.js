import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";
import { tripAuthDestination } from "@/lib/tripPlannerNavigation";
export const metadata = { title: "Sign up" };
export default async function SignupPage({ searchParams }) {
  const { next } = await searchParams;
  return (
    <AuthShell>
      <AuthForm mode="signup" next={tripAuthDestination(next)} />
    </AuthShell>
  );
}
