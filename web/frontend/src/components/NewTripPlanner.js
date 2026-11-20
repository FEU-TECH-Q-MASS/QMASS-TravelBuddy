"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TripPlanner from "@/components/TripPlanner";
import { useSiteAuth } from "@/components/layout/AppShell";
import { authHref, newTripHref } from "@/lib/tripPlannerNavigation";

export default function NewTripPlanner({ destination, draft }) {
  const { user, loading, profile, profileLoading, profileError, signingOut } = useSiteAuth();
  const router = useRouter();
  const loginHref = authHref("/login", newTripHref({ destination, draft }));

  useEffect(() => {
    if (!loading && !user && !signingOut.current) router.replace(loginHref);
  }, [loading, loginHref, router, signingOut, user]);

  if (loading || profileLoading) return <p className="notice mt-6" role="status">Loading trip planner…</p>;
  if (!user) return <p className="notice mt-6"><Link href={loginHref} className="text-link">Log in</Link> to plan a trip.</p>;
  if (profileError) return <p className="notice mt-6" role="alert">{profileError}</p>;
  if (profile?.role !== "traveler") {
    return <p className="notice mt-6">Trip creation is available to traveler accounts. <Link href="/dashboard" className="text-link">Go to dashboard</Link></p>;
  }

  return <TripPlanner key={`${user.id}:${destination}:${draft}`} mode="create" initialDestination={destination} resumePreview={draft} />;
}
