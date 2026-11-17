import Image from "next/image";
import Link from "next/link";
import SectionIntro from "@/components/SectionIntro";
import ClosingCta from "@/components/ClosingCta";
import Icon from "@/components/Icon";
export const metadata = { title: "About us" };
const team = [
  "Alexa Mhel V. Gagan",
  "Michaela Marie V. Gonzales",
  "Quervie B. Manrique",
  "Shane D. Oxina",
  "Sean Peji",
];
export default function AboutPage() {
  return (
    <>
      <section className="page-heading">
        <div className="page-width">
          <p className="eyebrow">Hello, we&apos;re TravelBuddy</p>
          <h1 className="page-title">
            For the places you dream of.
            <br />
            <span className="serif-accent">
              And the plans that get you there.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl leading-7 text-slate-500">
            We believe a trip should start with curiosity. TravelBuddy is our
            project to make the planning feel a little more connected, personal,
            and manageable.
          </p>
        </div>
      </section>
      <section className="page-width section-space grid items-center gap-12 lg:grid-cols-2">
        <div className="relative min-h-110 overflow-hidden rounded-3xl">
          <Image
            src="/images/alpine-lake.jpg"
            loading="eager"
            alt="A turquoise lake surrounded by forest and alpine mountains"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <SectionIntro
            eyebrow="Why we started"
            title={
              <>
                Fewer scattered details.
                <br />
                <span className="serif-accent">A clearer picture.</span>
              </>
            }
          >
            Flights in one tab. Hotels in another. Maps, weather, and a budget
            that needs to hold it all together.
          </SectionIntro>
          <p className="mt-5 text-sm leading-8 text-slate-500">
            TravelBuddy is designed to bring these pieces into one travel
            planning experience. The goal is a personalized itinerary that
            considers your destination, travel dates, interests, estimated
            costs, and time spent getting around.
          </p>
          <p className="mt-5 text-sm leading-8 text-slate-500">
            It is being developed as a Q-MASS academic project for System
            Integration and Architecture 2 at FEU Institute of Technology.
          </p>
          <Link href="/how-it-works" className="text-link mt-7">
            See how the idea comes together <Icon size={17} />
          </Link>
        </div>
      </section>
      <section className="bg-[#f5fafb]">
        <div className="page-width section-space">
          <SectionIntro
            center
            eyebrow="What guides the project"
            title={
              <>
                Thoughtful travel starts
                <br />
                <span className="serif-accent">with thoughtful choices.</span>
              </>
            }
          />
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              [
                "compass",
                "Personal by design",
                "Your interests, time, and budget should shape the plan, with room for your own decisions.",
              ],
              [
                "wallet",
                "Clear about the details",
                "Estimates should be labeled, costs should have context, and unavailable data should be explained.",
              ],
              [
                "route",
                "Connected with care",
                "External travel information should be validated and brought together in a useful, understandable way.",
              ],
            ].map(([icon, title, text]) => (
              <article key={title}>
                <Icon name={icon} size={30} className="text-brand-700" />
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="page-width section-space">
        <SectionIntro
          eyebrow="Meet Q-MASS"
          title={
            <>
              The people behind
              <br />
              <span className="serif-accent">your future travel buddy.</span>
            </>
          }
        ></SectionIntro>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((name, index) => (
            <li
              key={name}
              className="flex items-center gap-4 rounded-xl border border-slate-200 p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                0{index + 1}
              </span>
              <span className="text-sm font-semibold">{name}</span>
            </li>
          ))}
        </ul>
      </section>
      <ClosingCta />
    </>
  );
}
