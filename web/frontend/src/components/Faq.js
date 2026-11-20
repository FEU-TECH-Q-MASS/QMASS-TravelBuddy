import Icon from "@/components/Icon";
export const faqs = [
  [
    "How do I start planning a trip?",
    "Choose a starting airport and a Philippine destination in the trip planner. Add your travel dates, group size, and total budget. You can also select interests like food, nature, or adventure.",
  ],
  [
    "Do I need an account to use TravelBuddy?",
    "You can browse destinations and preview your trip details without an account. Sign in to generate and save an itinerary, then reopen it from your dashboard.",
  ],
  [
    "What will I see in my saved trip?",
    "Your trip includes a day-by-day itinerary with suggested activities, local routes you can open in Google Maps, and a budget breakdown with estimated costs. The Conditions tab shows weather and holiday information when available.",
  ],
  [
    "Can I include flights in my trip budget?",
    "Yes. Select “Include airfare in my total budget” in the trip planner to count estimated flight costs toward the budget for your whole group.",
  ],
  [
    "Can I book flights or hotels through TravelBuddy?",
    "TravelBuddy shows sample flight and hotel options with estimated prices. Check current prices and availability and book directly with the airline, hotel, or booking provider.",
  ],
];
export default function Faq() {
  return (
    <div className="mt-7">
      {faqs.map(([question, answer]) => (
        <details key={question} className="faq-item group">
          <summary>
            {question}
            <span className="shrink-0 text-brand-700">
              <Icon name="plus" className="group-open:hidden" />
              <Icon name="minus" className="hidden group-open:block" />
            </span>
          </summary>
          <p className="mt-4 max-w-2xl pr-8 text-sm leading-7 text-slate-500">
            {answer}
          </p>
        </details>
      ))}
    </div>
  );
}
