import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
export default function AuthShell({ children }) {
  return (
    <section className="page-width grid gap-8 py-9 sm:py-12 lg:grid-cols-[1fr_1fr]">
      <div className="relative hidden min-h-165 overflow-hidden rounded-3xl bg-brand-900 lg:block">
        <Image
          src="/images/alpine-lake.jpg"
          alt="A peaceful mountain lake waiting to be explored"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#062d40]/95 via-[#062d40]/10 to-transparent" />
        <div className="absolute right-10 bottom-12 left-10 text-white">
          <p className="mb-5 flex items-center gap-2 text-xs tracking-widest uppercase">
            <Icon name="compass" size={17} /> Your next chapter
          </p>
          <h2 className="text-4xl leading-tight font-semibold tracking-tight">
            A world of possibility.
            <br />
            <span className="serif-accent text-amber-200">
              A plan that feels like you.
            </span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/80">
            Keep your curiosity close. There&apos;s a whole world out there to
            discover.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-5 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/#home"
            className="mb-9 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-700"
          >
            <span className="rotate-180">
              <Icon size={16} />
            </span>{" "}
            Back to exploring
          </Link>
          {children}
        </div>
      </div>
    </section>
  );
}
