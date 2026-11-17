import Link from "next/link";
import SectionIntro from "@/components/SectionIntro";
import Steps from "@/components/Steps";
import SampleItinerary from "@/components/SampleItinerary";
import Faq from "@/components/Faq";
import ClosingCta from "@/components/ClosingCta";
import Icon from "@/components/Icon";
export const metadata = { title: "How it works" };
export default function HowItWorksPage() {
  return (
    <>
      <section className="page-heading">
        <div className="page-width">
          <p className="eyebrow">A simpler way to start</p>
          <h1 className="page-title">
            Big travel ideas.
            <br />
            <span className="serif-accent">A few thoughtful steps.</span>
          </h1>
          <p className="mt-6 max-w-xl leading-7 text-slate-500">
            TravelBuddy is designed to turn scattered details into a plan shaped
            around your time, interests, and budget.
          </p>
          <Link href="/#plan-trip" className="btn btn-dark mt-7">
            Try the trip preview <Icon size={17} />
          </Link>
        </div>
      </section>
      <section className="page-width pb-20">
        <Steps />
      </section>
      <section className="bg-[#f5fafb]">
        <div className="page-width section-space grid gap-12 lg:grid-cols-2">
          <SectionIntro
            eyebrow="The details make the difference"
            title={
              <>
                What goes into
                <br />
                <span className="serif-accent">a thoughtful plan?</span>
              </>
            }
          >
            The planned itinerary will use your preferences alongside travel
            information. Here is what each piece contributes.
          </SectionIntro>
          <div className="grid gap-7 sm:grid-cols-2">
            {[
              [
                "compass",
                "Your preferences",
                "Destination, dates, travelers, interests, and whether to include airfare.",
              ],
              [
                "wallet",
                "Your budget",
                "A clear total with a currency and a breakdown of estimated expenses.",
              ],
              [
                "route",
                "The connections",
                "Flight, hotel, place, and route information from planned external integrations.",
              ],
              [
                "sun",
                "The context",
                "Available forecasts and holiday dates, with limitations clearly explained.",
              ],
            ].map(([icon, title, text]) => (
              <article key={title}>
                <Icon name={icon} size={27} className="text-brand-700" />
                <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="page-width section-space">
        <div className="mb-10">
          <SectionIntro
            eyebrow="See the idea in action"
            title={
              <>
                A little structure.
                <br />
                <span className="serif-accent">A lot to look forward to.</span>
              </>
            }
          >
            An illustrative day plan gives you a feel for the experience. The
            amounts below are examples, not live provider quotes.
          </SectionIntro>
        </div>
        <SampleItinerary />
        <div className="notice mt-7">
          <h3 className="font-semibold">What you can try today</h3>
          <p className="mt-2">
            Explore destinations, preview your trip preferences, and browse the
            public pages. Personalized AI generation, live searches, accounts,
            and saving trips are planned for a later phase.
          </p>
        </div>
      </section>
      <section className="page-width pb-20">
        <SectionIntro
          eyebrow="Before you head off"
          title="A few helpful answers."
        />
        <Faq />
      </section>
      <ClosingCta />
    </>
  );
}
