import NewTripPlanner from "@/components/NewTripPlanner";
import { tripDestinationCode } from "@/lib/tripPlannerNavigation";

export const metadata = { title: "Plan a trip" };

export default async function NewTripPage({ searchParams }) {
  const { destination, draft } = await searchParams;

  return (
    <section className="page-width section-space">
      <h1 className="page-title">Plan a trip</h1>
      <p className="mt-3 max-w-xl text-slate-600">Choose your destination, dates, and budget to create a saved itinerary.</p>
      <NewTripPlanner destination={tripDestinationCode(destination)} draft={draft === "1"} />
    </section>
  );
}
