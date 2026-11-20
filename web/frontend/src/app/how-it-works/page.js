import Image from "next/image";
import Link from "next/link";
import SectionIntro from "@/components/SectionIntro";
import SampleItinerary from "@/components/SampleItinerary";
import ClosingCta from "@/components/ClosingCta";
import Icon from "@/components/Icon";

export const metadata = { title: "How it works" };

const steps = [
  {
    icon: "compass", title: "Start with your kind of trip.",
    text: "Pick your starting airport and destination. Add your dates, group size, and the things you love doing.",
    tags: ["Your destination", "Your dates", "Your interests"],
  },
  {
    icon: "wallet", title: "Give your plans a little shape.",
    text: "Set a total budget and currency, and choose whether to include airfare. Preview your preferences before saving a trip.",
    tags: ["A clear budget", "Your travel group", "A free preview"],
  },
  {
    icon: "route", title: "Make room for the adventure.",
    text: "Sign in to save a trip, open its workspace, and review your itinerary, routes, and estimates. Edit the details from your dashboard as plans change.",
    tags: ["Saved journeys", "A daily itinerary", "Room to refine"],
  },
];

const details = [
  ["compass", "Built around you", "Destination, interests, dates, and group size give your plan its starting point."],
  ["wallet", "A clearer view of costs", "Review estimates for activities, accommodation, meals, and transport alongside your total budget."],
  ["route", "The journey between stops", "Explore daily routes and locations, with maps available when the service is configured."],
  ["sun", "A little local context", "Check available weather and holiday information. Forecast coverage depends on your travel dates."],
];

const questions = [
  ["Do I need an account to get started?", "You can explore destinations and preview your trip preferences without an account. Sign in or create an account to save trips and return to them from your dashboard."],
  ["Can I change a saved trip?", "Yes. Open your dashboard and select the pen button on a trip. You can update its destination, dates, travelers, and budget. Saving rebuilds the itinerary preview, routes, and estimates using your new details."],
  ["Are the prices confirmed?", "Treat itinerary costs as planning estimates. Sample flights, hotels, and example prices are labeled accordingly. Confirm current availability, fees, and prices with the provider before making travel arrangements."],
  ["Can I book flights or hotels through TravelBuddy?", "TravelBuddy helps you plan and review travel options. Flight and hotel bookings and payments are not available on this website."],
  ["Will I see weather for every travel date?", "Weather depends on the provider’s forecast window and service availability. Trips outside that window may not have a forecast yet. Check again closer to departure."],
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="overflow-hidden bg-[#f1f8f9]">
        <div className="page-width grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
          <div>
            <p className="eyebrow flex items-center gap-2"><span className="h-px w-7 bg-brand-700" /> Less planning. More possibility.</p>
            <h1 className="page-title">From a travel idea<br />to <span className="serif-accent text-brand-700">a plan of your own.</span></h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-slate-500">Choose a place. Set your pace. Bring your dates, budget, and interests together in one place, with room for a little discovery.</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href="/#plan-trip" className="btn btn-dark">Start planning <Icon name="arrow" size={17} /></Link>
              <a href="#the-process" className="text-link text-sm">See the steps <Icon name="chevron" size={15} /></a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><Icon name="check" size={14} className="text-brand-700" /> No account needed to try the trip preview</p>
          </div>
          <div className="relative mx-auto w-full max-w-lg pb-6 pl-5 sm:pl-8">
            <div className="relative aspect-[4/4.2] overflow-hidden rounded-[2rem] bg-brand-900">
              <Image src="/images/palawan-el-nido-kayaking.jpg" alt="Kayaking through turquoise water beside the limestone cliffs of Palawan" fill priority sizes="(max-width: 1023px) 90vw, 500px" className="object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-brand-900/85 via-transparent to-transparent" />
              <div className="absolute right-6 bottom-24 left-6 text-white sm:bottom-28">
                <p className="text-[10px] font-bold tracking-[0.18em] text-cyan-100 uppercase">A little inspiration</p>
                <p className="mt-3 text-3xl leading-tight font-semibold tracking-tight">A different view.<br />Your kind of escape.</p>
              </div>
            </div>
            <div className="absolute right-5 bottom-0 left-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:right-10 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold tracking-[0.14em] text-brand-700 uppercase">Your trip, coming together</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Icon name="check" size={14} /></span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff5e4] text-amber-700"><Icon name="pin" size={18} /></span>
                <div><p className="text-sm font-semibold text-brand-900">Somewhere worth exploring</p><p className="mt-1 text-xs text-slate-500">Your dates · Your budget · Your pace</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="On this page" className="border-b border-slate-100 bg-white">
        <div className="page-width flex flex-wrap gap-x-8 gap-y-1 py-4 sm:justify-center sm:gap-14">
          {[["the-process", "The process"], ["a-day-in-the-plan", "A sample day"], ["helpful-answers", "Helpful answers"]].map(([id, label], index) => (
            <a key={id} href={`#${id}`} className="inline-flex items-center gap-2 py-2 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-700"><span className="text-[10px] text-brand-700">0{index + 1}</span>{label}</a>
          ))}
        </div>
      </nav>

      <section id="the-process" aria-labelledby="process-title" className="page-width section-space scroll-mt-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">A simpler way to start</p>
          <h2 id="process-title" className="section-title">Three steps.<br /><span className="serif-accent">So many places to go.</span></h2>
          <p className="mt-5 text-base leading-7 text-slate-500">You bring the curiosity. We help give the details a home.</p>
        </div>
        <ol className="mt-12 grid gap-5 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 sm:p-8">
              <div className="flex items-center justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 1 ? "bg-[#fff5e4] text-amber-700" : "bg-brand-50 text-brand-700"}`}><Icon name={step.icon} size={23} /></span>
                <span className="text-3xl font-light tracking-tight text-slate-200">0{index + 1}</span>
              </div>
              <h3 className="mt-7 max-w-60 text-xl leading-7 font-semibold tracking-tight text-brand-900">{step.title}</h3>
              <p className="mt-4 flex-1 text-sm leading-7 text-slate-500">{step.text}</p>
              <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-5">
                {step.tags.map((tag) => <li key={tag} className="flex items-center gap-2 text-xs text-slate-600"><Icon name="check" size={13} className="text-brand-700" />{tag}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-[#f5fafb]">
        <div className="page-width section-space grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <SectionIntro eyebrow="The details make the difference" title={<>A little thought.<br /><span className="serif-accent">A more personal journey.</span></>}>
              A good plan connects more than places. It helps you see how your time, budget, and interests fit together.
            </SectionIntro>
            <Link href="/#plan-trip" className="text-link mt-7">Make a plan that feels like you <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {details.map(([icon, title, text]) => (
              <article key={title} className="rounded-2xl border border-slate-100 bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon name={icon} size={20} /></span>
                <h3 className="mt-5 text-sm font-semibold text-brand-900">{title}</h3>
                <p className="mt-3 text-xs leading-6 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="a-day-in-the-plan" className="page-width section-space scroll-mt-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <SectionIntro eyebrow="See the idea in action" title={<>A little structure.<br /><span className="serif-accent">A lot to look forward to.</span></>}>
            Here is how one easygoing day could look. A few stops, time to explore, and an estimate to help you plan.
          </SectionIntro>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-[11px] font-medium text-slate-500"><Icon name="eye" size={14} /> Illustrative preview</span>
        </div>
        <SampleItinerary />
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-cyan-100 bg-brand-50 px-5 py-4">
          <Icon name="compass" size={20} className="mt-0.5 shrink-0 text-brand-700" />
          <div><h3 className="text-sm font-semibold text-brand-900">Start with a preview. Keep it with an account.</h3><p className="mt-1 text-xs leading-6 text-slate-600">Try your preferences on the homepage, then sign in to save a trip and return to its workspace. Sample costs are estimates; check current prices before booking.</p></div>
        </div>
      </section>

      <section id="helpful-answers" aria-labelledby="answers-title" className="page-width scroll-mt-28 pb-20 sm:pb-24">
        <div className="grid gap-8 border-t border-slate-200 pt-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16 lg:pt-16">
          <div>
            <p className="eyebrow">Before you head off</p>
            <h2 id="answers-title" className="section-title">A few<br /><span className="serif-accent">helpful answers.</span></h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">A little clarity before you start your next chapter.</p>
            <Link href="/contact" className="text-link mt-6 text-sm">Still have a question? <Icon name="arrow" size={15} /></Link>
          </div>
          <div className="space-y-3">
            {questions.map(([question, answer]) => (
              <details key={question} className="group rounded-2xl border border-slate-200 bg-white px-5 open:border-brand-700/30 open:bg-[#f5fafb] sm:px-6">
                <summary className="flex min-h-17 cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm leading-6 font-semibold text-brand-900 [&::-webkit-details-marker]:hidden">
                  {question}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 text-brand-700 group-open:bg-white"><Icon name="plus" size={15} className="group-open:hidden" /><Icon name="minus" size={15} className="hidden group-open:block" /></span>
                </summary>
                <p className="border-t border-slate-200/70 pt-4 pb-5 text-sm leading-7 text-slate-500">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <ClosingCta />
    </>
  );
}
