"use client";

import Link from "next/link";
import { useSiteAuth } from "@/components/layout/AppShell";
import { newTripHref } from "@/lib/tripPlannerNavigation";

export default function TripPlanningLink({ destination, children, ...props }) {
  const { profile } = useSiteAuth();
  const query = destination ? `?destination=${encodeURIComponent(destination)}` : "";
  const href = profile?.role === "traveler" ? newTripHref({ destination }) : `/${query}#plan-trip`;
  return <Link href={href} {...props}>{children}</Link>;
}
