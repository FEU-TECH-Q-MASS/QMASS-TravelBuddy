import DestinationExplorer from "@/components/DestinationExplorer";
import ClosingCta from "@/components/ClosingCta";
export const metadata = {
  title: "Explore destinations",
  description:
    "Find destination inspiration for your next trip, from quiet coastlines to culture-filled city streets.",
};
export default function ExplorePage() {
  return (
    <>
      <section className="page-heading">
        <div className="page-width">
          <p className="eyebrow">Somewhere new is waiting</p>
          <h1 className="page-title">
            Follow a feeling.
            <br />
            <span className="serif-accent">Find your next destination.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-500">
            From a peaceful lakeside morning to a city full of stories, discover
            a place that feels like your kind of adventure.
          </p>
        </div>
      </section>
      <DestinationExplorer />
      <ClosingCta />
    </>
  );
}
