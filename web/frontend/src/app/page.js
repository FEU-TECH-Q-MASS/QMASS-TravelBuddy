import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import SectionIntro from "@/components/SectionIntro";
import TripPlanner from "@/components/TripPlanner";
import DestinationCard from "@/components/DestinationCard";
import Steps from "@/components/Steps";
import SampleItinerary from "@/components/SampleItinerary";
import Faq from "@/components/Faq";
import ClosingCta from "@/components/ClosingCta";
import { destinations } from "@/lib/destinations";

export default async function HomePage({ searchParams }) {
  const query = await searchParams;
  const initialDestination =
    typeof query.destination === "string"
      ? query.destination.slice(0, 100)
      : "";
  return (
    <>
      <section className="relative mx-auto min-h-150 max-w-[1800px] overflow-hidden bg-brand-900 pb-30 sm:min-h-160">
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
            <a href="#plan-trip" className="btn btn-primary">
              Start Planning <Icon />
            </a>
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
          {destinations.slice(0, 5).map((destination) => (
            <DestinationCard key={destination.slug} destination={destination} />
          ))}
        </div>
        <p className="mt-4 text-[11px] text-slate-400">
          Curated destination inspiration · Availability and travel conditions
          are not live.
        </p>
      </section>
      <section className="bg-[#f5fafb]">
        <div className="page-width section-space grid items-center gap-12 lg:grid-cols-2">
          <div className="relative min-h-115 overflow-hidden rounded-3xl">
            <Image
              src="/images/lake-journey.jpg"
              alt="Traveler taking in a peaceful alpine lake and mountain view"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute right-5 bottom-5 left-5 rounded-2xl bg-white/95 p-5 backdrop-blur">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="spark" className="text-brand-700" /> More than a
                list of places.
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                A thoughtful way to bring your whole trip into view.
              </p>
            </div>
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
