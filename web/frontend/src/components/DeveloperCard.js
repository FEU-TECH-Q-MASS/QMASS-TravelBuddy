"use client";

import Image from "next/image";
import { useState } from "react";

export default function DeveloperCard({ name, photo, initials }) {
  const [photoUnavailable, setPhotoUnavailable] = useState(false);

  return (
    <article className="group h-full overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:border-brand-700/40">
      <div className="relative isolate aspect-square overflow-hidden bg-[#eaf4f5]">
        <div aria-hidden="true" className="absolute -top-16 -right-10 h-52 w-52 rounded-full border border-brand-700/10" />
        <div aria-hidden="true" className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full border border-brand-700/10" />
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="flex h-24 w-24 items-center justify-center rounded-full border border-white bg-white/70 text-3xl font-medium tracking-tight text-brand-700">{initials}</span>
        </div>
        {!photoUnavailable && (
          <Image
            src={photo}
            alt={`Portrait of ${name}`}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover object-top transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
            onError={() => setPhotoUnavailable(true)}
          />
        )}
        <span className="absolute bottom-4 left-4 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-brand-700 uppercase">Q-MASS</span>
      </div>
      <div className="px-6 py-6">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-brand-700 uppercase">Developer</p>
        <h3 className="mt-2 text-lg leading-7 font-semibold tracking-tight text-brand-900">{name}</h3>
        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-700/60" />
          TravelBuddy team
        </div>
      </div>
    </article>
  );
}
