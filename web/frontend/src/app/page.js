export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16 sm:px-12">
      <p className="text-sm font-semibold tracking-widest text-brand-700">Q-MASS / TRAVELBUDDY</p>
      <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
        Every great trip starts with a plan.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
        TravelBuddy is being built to bring destinations, travel dates, interests,
        and budgets together in one travel planner.
      </p>
      <section aria-labelledby="status-heading" className="mt-10 rounded-2xl border border-teal-200 bg-brand-50 p-6">
        <h2 id="status-heading" className="text-lg font-semibold text-brand-900">Project foundation ready</h2>
        <p className="mt-2 leading-7 text-slate-700">
          The application is in development. Trip planning, accounts, saved trips,
          and live travel integrations are coming in future development phases.
        </p>
      </section>
    </main>
  );
}
