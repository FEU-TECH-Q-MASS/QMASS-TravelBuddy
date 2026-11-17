import Link from "next/link";
export default function NotFound() {
  return (
    <section className="page-width py-24 text-center">
      <p className="eyebrow">A little off the beaten path</p>
      <h1 className="page-title mx-auto">This stop isn&apos;t on the map.</h1>
      <p className="mt-6 text-slate-500">
        The page you&apos;re looking for couldn&apos;t be found.
      </p>
      <Link href="/explore" className="btn btn-primary mt-8">
        Explore destinations
      </Link>
    </section>
  );
}
