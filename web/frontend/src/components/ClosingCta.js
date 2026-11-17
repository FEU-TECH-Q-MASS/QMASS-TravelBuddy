import Link from "next/link";
import Icon from "@/components/Icon";
export default function ClosingCta() {
  return (
    <section className="page-width pb-20">
      <div className="cta-banner flex flex-col items-start justify-between gap-8 rounded-3xl px-8 py-12 sm:px-12 lg:flex-row lg:items-center">
        <div>
          <p className="eyebrow text-cyan-100!">A new story is waiting</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Where will your curiosity take you?
          </h2>
          <p className="mt-4 max-w-lg leading-7 text-cyan-50">
            Pick a place. Set your pace. Let&apos;s start shaping your next
            adventure.
          </p>
        </div>
        <Link href="/#plan-trip" className="btn btn-primary shrink-0">
          Start Planning <Icon />
        </Link>
      </div>
    </section>
  );
}
