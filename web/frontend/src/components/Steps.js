import Icon from "@/components/Icon";
export const steps = [
  {
    title: "Make it yours",
    icon: "compass",
    text: "Tell us where you want to go, when you want to travel, and what you love doing.",
  },
  {
    title: "Bring the details together",
    icon: "route",
    text: "The planned itinerary brings activities, travel time, and estimated costs into one place.",
  },
  {
    title: "Find your kind of adventure",
    icon: "spark",
    text: "Review the details and refine your preferences. Saving your favorite plans is coming next.",
  },
];
export default function Steps() {
  return (
    <div className="mt-12 grid gap-10 md:grid-cols-3">
      {steps.map((step, index) => (
        <article key={step.title} className="relative">
          <div className="mb-6 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Icon name={step.icon} size={25} />
            </span>
            <span className="text-xs font-semibold tracking-widest text-slate-300">
              0{index + 1}
            </span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-500">{step.text}</p>
        </article>
      ))}
    </div>
  );
}
