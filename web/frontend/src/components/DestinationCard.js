import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
export default function DestinationCard({ destination, large = false }) {
  return (
    <Link
      href={`/explore/${destination.slug}`}
      className={`destination-card group bg-linear-to-br from-brand-700 to-brand-900 ${large ? "min-h-100" : "min-h-82"}`}
    >
      {destination.image && (
        <Image
          src={destination.image}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/5 to-transparent" />
      <span className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-800">
        {destination.interests[0]}
      </span>
      <div className="relative mt-auto w-full p-6 text-white">
        <p className="mb-2 flex items-center gap-1.5 text-xs text-white/85">
          <Icon name="pin" size={13} />
          {destination.parent ? `Palawan · ${destination.airport}` : destination.region}
        </p>
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-2xl font-semibold tracking-tight">
            {destination.name}
          </h3>
          <span className="rounded-full border border-white/50 p-2 transition-colors group-hover:bg-white group-hover:text-slate-900">
            <Icon size={17} />
          </span>
        </div>
        <p className="mt-2 text-xs text-white/80">{destination.tag}</p>
      </div>
    </Link>
  );
}
