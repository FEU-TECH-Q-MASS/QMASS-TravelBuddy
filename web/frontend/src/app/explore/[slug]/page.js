import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import DestinationCard from "@/components/DestinationCard";
import TripPlanningLink from "@/components/TripPlanningLink";
import { destinations, topLevelDestinations } from "@/lib/destinations";

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
  const destination = topLevelDestinations.find((item) => item.slug === slug) || destinations.find((item) => item.slug === slug);
  if (!destination) notFound();
  const credit = destination.photoCredit;
  return (
    <>
      <section className="relative min-h-115 bg-linear-to-br from-brand-700 to-brand-900">
        {destination.image && (
          <Image
            src={destination.image}
            alt=""
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
      {credit && (
        <p className="page-width pt-3 text-xs text-slate-500">
          <a href={credit.source} className="underline">Photo by {credit.author}</a>
          {" · "}
          {credit.licenseUrl ? <a href={credit.licenseUrl} className="underline">{credit.license}</a> : credit.license}
          {" · Resized and converted to WebP"}
        </p>
      )}
      <section className="page-width grid gap-12 py-16 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <h2 className="section-title">{destination.bases ? "Choose your Palawan base" : "Places to visit"}</h2>
          {destination.description && <p className="mt-5 text-lg leading-8 text-slate-500">{destination.description}</p>}
          {destination.bases ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {destination.bases.map((base) => <DestinationCard key={base.code} destination={base} />)}
            </div>
          ) : (
            <ul className="mt-5 space-y-4">
              {destination.highlights.map((place) => (
                <li key={place} className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="rounded-full bg-brand-50 p-1.5 text-brand-700"><Icon name="check" size={14} /></span>
                  {place}
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="h-fit rounded-2xl border border-slate-200 p-7">
          <Icon name="compass" className="text-brand-700" size={28} />
          <h2 className="mt-5 text-2xl font-semibold">
            {destination.bases ? "Plan your Palawan trip" : "Getting there"}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            {destination.airportName ? `${destination.airportName} (${destination.airport})`
              : destination.bases ? "Confirm your stay before choosing a flight." : "Reach Banaue by road. Check buses from Manila or arrange a road transfer from your arrival gateway."}
          </p>
          {destination.transfer && <p className="mt-2 text-sm leading-6 text-slate-500">{destination.transfer}</p>}
          <TripPlanningLink
            destination={destination.code}
            className="btn btn-primary mt-6 w-full"
          >
            Plan a trip here <Icon size={17} />
          </TripPlanningLink>
          {destination.parent && <Link href="/explore/palawan" className="mt-4 inline-block text-sm font-semibold text-brand-700">See other Palawan bases</Link>}
        </aside>
      </section>
      <section className="page-width pb-20">
        <h2 className="section-title">Explore more destinations</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topLevelDestinations
            .filter((item) => item.slug !== slug)
            .sort((first, second) => Number(second.group === destination.group) - Number(first.group === destination.group))
            .slice(0, 3)
            .map((item) => (
              <DestinationCard key={item.slug} destination={item} />
            ))}
        </div>
      </section>
    </>
  );
}
