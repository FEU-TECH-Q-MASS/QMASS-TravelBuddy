import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import DestinationCard from "@/components/DestinationCard";
import TripPlanningLink from "@/components/TripPlanningLink";
import { destinations, getDestinationsWithImages } from "@/lib/destinations";

export function generateStaticParams() {
  return destinations.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const destination = destinations.find((item) => item.slug === slug);
  return {
    title: destination
      ? `Discover ${destination.name}`
      : "Destination not found",
  };
}
export default async function DestinationPage({ params }) {
  const { slug } = await params;
  const availableDestinations = await getDestinationsWithImages();
  const destination = availableDestinations.find((item) => item.slug === slug);
  if (!destination) notFound();
  return (
    <>
      <section className="relative min-h-115 bg-linear-to-br from-brand-700 to-brand-900">
        {destination.image && (
          <Image
            src={destination.image}
            alt={destination.alt}
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-slate-950/80 to-slate-950/10" />
        <div className="page-width relative py-16">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-xs text-white/90"
          >
            <span className="rotate-180">
              <Icon size={15} />
            </span>{" "}
            All destinations
          </Link>
          <p className="mt-16 text-xs font-semibold tracking-widest text-white/80 uppercase">
            {destination.country} · {destination.region}
          </p>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-white sm:text-7xl">
            {destination.name}
          </h1>
          <p className="serif-accent mt-4 text-2xl text-amber-200">
            {destination.tag}
          </p>
        </div>
      </section>
      <section className="page-width grid gap-12 py-16 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="eyebrow">A little destination inspiration</p>
          <h2 className="section-title">Make room for a new perspective.</h2>
          <p className="mt-6 text-lg leading-8 text-slate-500">
            {destination.description}
          </p>
          <h3 className="mt-10 text-lg font-semibold">
            A few ideas for your visit
          </h3>
          <ul className="mt-5 space-y-4">
            {destination.highlights.map((text) => (
              <li
                key={text}
                className="flex items-center gap-3 text-sm text-slate-600"
              >
                <span className="rounded-full bg-brand-50 p-1.5 text-brand-700">
                  <Icon name="check" size={14} />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <div className="notice mt-8">
            <p className="font-semibold">A thoughtful planning note</p>
            <p className="mt-1">{destination.note}</p>
          </div>
        </div>
        <aside className="h-fit rounded-2xl border border-slate-200 p-7">
          <Icon name="compass" className="text-brand-700" size={28} />
          <h2 className="mt-5 text-2xl font-semibold">
            Picture yourself here?
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            Start with your dates, budget, and interests. We&apos;ll help you
            preview your trip preferences.
          </p>
          <TripPlanningLink
            destination={destination.name}
            className="btn btn-primary mt-6 w-full"
          >
            Plan a trip here <Icon size={17} />
          </TripPlanningLink>
          <p className="mt-4 text-xs leading-6 text-slate-500">
            Editorial inspiration only. Check official travel advice and local
            conditions. Live itinerary generation is not connected yet.
          </p>
        </aside>
      </section>
      <section className="page-width pb-20">
        <h2 className="section-title">Keep your curiosity going.</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {availableDestinations
            .filter((item) => item.slug !== slug)
            .slice(0, 3)
            .map((item) => (
              <DestinationCard key={item.slug} destination={item} />
            ))}
        </div>
      </section>
    </>
  );
}
