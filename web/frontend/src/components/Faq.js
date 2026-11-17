import Icon from "@/components/Icon";
export const faqs = [
  [
    "What is TravelBuddy?",
    "TravelBuddy is a travel planning project designed to combine your destination, dates, budget, and interests into a personalized itinerary. You can currently explore destination inspiration and preview your trip preferences.",
  ],
  [
    "Can I book flights or hotels here?",
    "TravelBuddy focuses on planning. Flight and accommodation information is planned for future integrations; booking and payments are not available on this website.",
  ],
  [
    "Are the itinerary prices live?",
    "No. The sample itinerary contains illustrative estimates, not live quotes. When integrations are available, prices will need source timestamps and clear fee information.",
  ],
  [
    "Do I need an account to explore?",
    "No account is needed to browse these public pages or preview trip preferences. Accounts and saving trips are planned features; login and signup currently show the interface only.",
  ],
  [
    "Will weather be available for every travel date?",
    "Weather information will depend on the provider's forecast window. A future trip outside that window will be marked as unavailable rather than presented as a confirmed forecast.",
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
