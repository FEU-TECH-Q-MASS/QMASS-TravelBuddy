import Link from "next/link";
import Icon from "@/components/Icon";
import ContactForm from "@/components/ContactForm";
export const metadata = { title: "Contact us" };
export default function ContactPage() {
  return (
    <>
      <section className="page-heading">
        <div className="page-width">
          <p className="eyebrow">Let&apos;s start a conversation</p>
          <h1 className="page-title">
            Good questions lead
            <br />
            <span className="serif-accent">to better journeys.</span>
          </h1>
          <p className="mt-6 max-w-xl leading-7 text-slate-500">
            Have a question about TravelBuddy or an idea to make planning
            better? This is a place to start.
          </p>
        </div>
      </section>
      <section className="page-width grid gap-12 py-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="pt-3">
          <span className="inline-flex rounded-2xl bg-brand-50 p-4 text-brand-700">
            <Icon name="mail" size={30} />
          </span>
          <h2 className="mt-7 text-3xl font-semibold tracking-tight">
            A little connection
            <br />
            goes a long way.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">
            TravelBuddy is an academic project by the Q-MASS team. Public
            contact channels will be added when they are available.
          </p>
          <div className="mt-8 rounded-xl bg-[#faf9f6] p-6">
            <h3 className="text-sm font-semibold">
              Looking for a quick answer?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Our guide covers trip previews, estimates, and what&apos;s
              available today.
            </p>
            <Link href="/how-it-works" className="text-link mt-4">
              See how it works <Icon size={16} />
            </Link>
          </div>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
