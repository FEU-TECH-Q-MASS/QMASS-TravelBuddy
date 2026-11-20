import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import SectionIntro from "@/components/SectionIntro";
import TripPlanner from "@/components/TripPlanner";
import TripPlanningLink from "@/components/TripPlanningLink";
import DestinationCard from "@/components/DestinationCard";
import Steps from "@/components/Steps";
import SampleItinerary from "@/components/SampleItinerary";
import Faq from "@/components/Faq";
import ClosingCta from "@/components/ClosingCta";
import { topLevelDestinations } from "@/lib/destinations";

const popularDestinations = ["boracay", "cebu", "bohol", "palawan", "siargao"]
  .map((slug) => topLevelDestinations.find((destination) => destination.slug === slug))
  .filter(Boolean);

export default async function HomePage({ searchParams }) {
  const query = await searchParams;
  const initialDestination =
    typeof query.destination === "string"
      ? query.destination.slice(0, 100)
      : "";
  return (
    <>
      <section id="home" className="relative mx-auto min-h-150 max-w-[1800px] scroll-mt-22 overflow-hidden bg-brand-900 pb-30 sm:min-h-160">
        <Image
          src="/images/palawan-coron-lagoon.jpg"
          alt="Blue-green waters and limestone islands in Palawan, Philippines"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_48%]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#062d40]/90 via-[#062d40]/55 to-[#062d40]/10" />
        <div className="page-width relative pt-18 pb-18 sm:pt-22">
          <h1 className="max-w-3xl text-[46px] leading-[1.07] font-semibold tracking-[-0.045em] text-white sm:text-[72px]">
            Less searching.
            <br />
            More{" "}
            <span className="serif-accent text-[#ffbf56]">discovering.</span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-white/85">
            Your destination. Your budget. Your kind of adventure. Bring the
            little details together and make room for the memories.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <TripPlanningLink destination={initialDestination} className="btn btn-primary">
              Start Planning <Icon />
            </TripPlanningLink>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white underline-offset-4 hover:underline"
            >
              See how it works <Icon size={16} />
            </Link>
          </div>
          <p className="mt-10 flex items-center gap-2 text-xs text-white/75">
            <Icon name="pin" size={14} /> A little inspiration from Palawan,
            Philippines
          </p>
        </div>
      </section>
      <TripPlanner initialDestination={initialDestination} />
      <div className="page-width grid gap-5 border-b border-slate-100 py-9 sm:grid-cols-3">
        {[
          ["compass", "Planned around you", "Your interests set the direction"],
          ["wallet", "Room for your budget", "Keep the bigger picture in view"],
          ["leaf", "A pace that feels right", "More moments, less rushing"],
        ].map(([icon, title, text]) => (
          <div key={title} className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Icon name={icon} />
            </span>
            <div>
              <h2 className="text-xs font-semibold">{title}</h2>
              <p className="mt-1 text-[11px] text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <section className="page-width section-space">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionIntro
            eyebrow="Follow your curiosity"
            title={
              <>
                Some places just{" "}
                <span className="serif-accent">call to you.</span>
              </>
            }
          >
            A quiet escape, a cultural detour, or a whole new perspective. Find
            a little inspiration for your next chapter.
          </SectionIntro>
          <Link href="/explore" className="text-link shrink-0">
            Explore destinations <Icon size={17} />
          </Link>
        </div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {popularDestinations.map((destination) => (
            <DestinationCard key={destination.slug} destination={destination} />
          ))}
          <Link
            href="/explore"
            className="destination-card group min-h-82 flex-col justify-between bg-brand-900 p-6 text-white"
          >
            <Image
              src="/images/manila.jpg"
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/20 to-slate-950/10" />
            <span className="relative self-start rounded-full bg-slate-950/50 p-2.5 text-amber-200">
              <Icon name="compass" size={26} />
            </span>
            <div className="relative flex items-center justify-between gap-4">
              <h3 className="text-2xl font-semibold tracking-tight">
                Explore more destinations
              </h3>
              <span className="shrink-0 rounded-full border border-white/50 p-2 transition-colors group-hover:bg-white group-hover:text-slate-900">
                <Icon size={17} />
              </span>
            </div>
          </Link>
        </div>
        <p className="mt-4 text-[11px] text-slate-400">
          Curated destination inspiration · Availability and travel conditions
          are not live.
        </p>
      </section>
      <section className="bg-[#f5fafb]">
        <div className="page-width section-space grid gap-12 lg:grid-cols-2">
          <div className="relative min-h-115 overflow-hidden rounded-3xl lg:min-h-0">
            <Image
              src="/images/philippines.jpg"
              alt="Traveler taking in a peaceful alpine lake and mountain view"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <SectionIntro
              eyebrow="Meet your travel buddy"
              title={
                <>
                  Good trips start with
                  <br />
                  <span className="serif-accent">the little details.</span>
                </>
              }
            >
              Travel planning can mean a dozen open tabs. TravelBuddy is
              designed to help the pieces make sense together.
            </SectionIntro>
            <div className="mt-8 space-y-6">
              {[
                [
                  "wallet",
                  "A clearer view of your budget",
                  "See how activities and travel costs fit into the amount you want to spend.",
                ],
                [
                  "route",
                  "Days that flow naturally",
                  "Bring nearby activities and travel time together in a plan that makes sense.",
                ],
                [
                  "sun",
                  "A little more awareness",
                  "Weather and seasonal context are planned to help you prepare for the unexpected.",
                ],
              ].map(([icon, title, text]) => (
                <div key={title} className="flex gap-4">
                  <span className="mt-1 text-brand-700">
                    <Icon name={icon} size={23} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/about" className="text-link mt-8">
              Get to know TravelBuddy <Icon size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="page-width section-space">
        <SectionIntro
          center
          eyebrow="From someday to a starting point"
          title={
            <>
              Your adventure,{" "}
              <span className="serif-accent">in three steps.</span>
            </>
          }
        >
          A simpler way to move from a travel idea to a plan you can make your
          own.
        </SectionIntro>
        <Steps />
      </section>
      <section className="bg-[#faf9f6]">
        <div className="page-width section-space">
          <div className="mb-10">
            <SectionIntro
              eyebrow="A glimpse of the journey"
              title={
                <>
                  Less guesswork.
                  <br />
                  <span className="serif-accent">More looking forward.</span>
                </>
              }
            >
              Here is an illustrative look at how a day could come together.
              Live personalized itineraries are coming in a later phase.
            </SectionIntro>
          </div>
          <SampleItinerary />
        </div>
      </section>
      <section className="page-width section-space grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionIntro
            eyebrow="A few things to know"
            title={
              <>
                Curiosity is
                <br />
                <span className="serif-accent">always welcome.</span>
              </>
            }
          >
            Have another question? We&apos;d love to hear what&apos;s on your
            mind.
          </SectionIntro>
          <Link href="/contact" className="text-link mt-6">
            Get in touch <Icon size={17} />
          </Link>
        </div>
        <Faq />
      </section>
      <ClosingCta />
    </>
  );
}
