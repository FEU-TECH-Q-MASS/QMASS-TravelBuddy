import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/Icon";
import ContactForm from "@/components/ContactForm";
export const metadata = { title: "Contact us" };
export default function ContactPage() {
  return (
    <>
      <div className="bg-white">
        <div className="border-b border-cyan-100 bg-[#eaf4f5]">
        <section className="page-width pt-12 pb-10 sm:pt-16 sm:pb-12">
          <p className="eyebrow inline-flex items-center gap-2"><Icon name="mail" size={15} /> Let&apos;s start a conversation</p>
          <h1 className="page-title">Good questions.<br /><span className="serif-accent text-brand-700">Better journeys.</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">A question, a fresh idea, or something we could do better?<br className="hidden sm:block" /> We&apos;d love to hear what&apos;s on your mind.</p>
        </section>
        </div>

        <section aria-label="Contact the TravelBuddy team" className="page-width grid items-stretch gap-6 pt-10 pb-16 lg:grid-cols-[0.8fr_1.2fr] sm:pt-12 sm:pb-24">
          <div className="order-2 grid min-w-0 gap-6 sm:grid-cols-2 lg:order-1 lg:flex lg:flex-col">
            <div className="flex flex-col overflow-hidden rounded-3xl bg-brand-900 lg:flex-1">
              <div className="p-7 sm:p-8">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-cyan-100"><Icon name="users" size={21} /></span>
                <p className="mt-6 text-[10px] font-bold tracking-[0.18em] text-cyan-200 uppercase">A note from Q-MASS</p>
                <h2 className="mt-3 text-2xl leading-8 font-semibold tracking-tight text-white">Made by people.<br /><span className="serif-accent text-cyan-100">Shaped by you.</span></h2>
                <p className="mt-4 text-sm leading-7 text-white/70">We&apos;re the student team behind TravelBuddy at FEU Institute of Technology. Your feedback helps us make travel planning a little more thoughtful.</p>
                <Link href="/about" className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-white underline-offset-4 hover:underline">Meet the team <Icon name="arrow" size={15} /></Link>
              </div>
              <div className="relative min-h-40 flex-1 border-t border-white/10">
                <Image src="/images/palawan-el-nido-kayaking.jpg" alt="Turquoise water and limestone cliffs in Palawan" fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 450px" className="object-cover object-center" />
                <div className="absolute inset-0 bg-linear-to-b from-brand-900/25 to-transparent" />
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#f5fafb] p-6 sm:p-7">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff5e4] text-amber-700"><Icon name="compass" size={20} /></span>
              <div className="min-w-0">
                <h2 className="text-sm leading-6 font-semibold text-brand-900">Looking for a quick answer?</h2>
                <p className="mt-2 text-xs leading-6 text-slate-500">Find help with saved trips, previews, and budget estimates.</p>
                <Link href="/how-it-works#helpful-answers" className="text-link mt-3 text-xs">Browse helpful answers <Icon name="arrow" size={15} /></Link>
              </div>
            </div>
          </div>
          <div className="order-1 min-w-0 lg:order-2"><ContactForm /></div>
        </section>
      </div>
    </>
  );
}
