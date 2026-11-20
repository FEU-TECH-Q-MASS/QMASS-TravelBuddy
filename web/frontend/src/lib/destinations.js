import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";

// Philippine travel inspiration only: no live availability, prices, or advisories.
export const destinations = [
  { slug: "palawan", name: "Palawan", country: "Philippines", region: "Philippines", tag: "A softer kind of escape", interests: ["Beach", "Nature"], image: "/images/palawan-el-nido-kayaking.jpg", alt: "Limestone islands surrounded by clear blue water in Palawan", description: "Clear-water coves, limestone coastlines, and unhurried island days.", highlights: ["Enjoy a coastal viewpoint", "Leave an afternoon for the beach", "Explore locally available island activities"], note: "Check local weather and activity availability before setting out." },
  { slug: "bohol", name: "Bohol", country: "Philippines", region: "Visayas", tag: "Nature with a little wonder", interests: ["Nature", "Culture"], image: "/images/bohol.jpg", alt: "A peaceful tropical landscape for a Bohol getaway", description: "Island roads, river views, heritage stops, and slow afternoons.", highlights: ["Visit a countryside viewpoint", "Make time for a river or coastal stop", "Try local food between activities"], note: "Group nearby stops and confirm local transport before going." },
  { slug: "cebu", name: "Cebu", country: "Philippines", region: "Visayas", tag: "City energy, island days", interests: ["Beach", "Adventure"], image: "/images/cebu.jpg", alt: "A scenic outdoor landscape representing a Cebu adventure", description: "A lively starting point for food, heritage, waterfalls, and sea views.", highlights: ["Explore a heritage area", "Plan one outdoor adventure", "Leave room for a relaxed local meal"], note: "Allow travel time between Cebu City and outdoor attractions." },
  { slug: "boracay", name: "Boracay", country: "Philippines", region: "Visayas", tag: "Beach days, easy pace", interests: ["Beach", "Nature"], image: "/images/boracay-shangri-la.jpg", alt: "Clear Philippine waters representing a Boracay beach day", description: "White sand, warm evenings, and enough space to set your own pace.", highlights: ["Plan a beach morning", "Catch a sunset by the water", "Balance activities with unplanned time"], note: "Check local environmental and transport rules before visiting." },
  { slug: "banaue", name: "Banaue", country: "Philippines", region: "Luzon", tag: "Mountain stories", interests: ["Nature", "Culture", "Adventure"], image: "/images/banaue.jpg", alt: "A mountain landscape representing a Banaue journey", description: "Mountain roads, living heritage, and views worth the slower route.", highlights: ["Visit a viewpoint with a local guide", "Learn about the surrounding heritage", "Build in rest time for mountain travel"], note: "Verify road conditions and guide availability before departure." },
  {
    slug: "manila",
    name: "Manila",
    country: "Philippines",
    region: "Metro Manila",
    tag: "Walk through the city's history",
    interests: ["Culture", "Food"],
    image: "/images/manila.jpg",
    alt: "",
    description: "Walk the old streets of Intramuros, pause at Rizal Park, and make time for a meal between stops.",
    highlights: ["Explore Intramuros", "Visit Fort Santiago", "Take a walk through Rizal Park"],
    note: "Allow extra time between stops if you're crossing the city.",
  },
  {
    slug: "dumaguete",
    name: "Dumaguete",
    country: "Philippines",
    region: "Negros Oriental",
    tag: "A stroll by the sea",
    interests: ["Culture", "Food"],
    image: "/images/dumaguete.jpg",
    alt: "",
    description: "Follow the waterfront along Rizal Boulevard before exploring the city's historic center.",
    highlights: ["Walk along Rizal Boulevard", "See the historic Dumaguete Belfry", "Stop for a meal downtown"],
    note: "Group the downtown stops together for an easy day on foot.",
  },
  {
    slug: "puerto-princesa",
    name: "Puerto Princesa",
    country: "Philippines",
    region: "Palawan",
    tag: "From the forest to the coast",
    interests: ["Nature", "Adventure"],
    image: "/images/palawan-puerto-princesa.jpg",
    alt: "",
    description: "Make time for Palawan's underground river, then spend a slower day by the coast.",
    highlights: ["Plan a visit to the Underground River", "Explore Sabang on the coast", "Set aside an evening for local food"],
    note: "Confirm tour arrangements and travel time to Sabang before setting out.",
  },
  {
    slug: "coron",
    name: "Coron",
    country: "Philippines",
    region: "Palawan",
    tag: "Lagoons between limestone cliffs",
    interests: ["Nature", "Beach", "Adventure"],
    image: "/images/palawan-coron-lagoon.jpg",
    alt: "Boats lined up in turquoise water between limestone cliffs in Coron",
    description: "Spend a day among limestone cliffs, sheltered lagoons, and the clear water around Coron Island.",
    highlights: ["Visit Kayangan Lake", "See the Twin Lagoons", "Leave time for a waterfront meal"],
    note: "Confirm boat schedules and local weather before planning a day on the water.",
  },
  {
    slug: "tacloban",
    name: "Tacloban",
    country: "Philippines",
    region: "Leyte",
    tag: "Waterfront views and local history",
    interests: ["Culture", "Nature"],
    image: "/images/tacloban.jpg",
    alt: "",
    description: "Explore Tacloban's heritage and make time for views over the San Juanico Strait.",
    highlights: ["See the San Juanico Bridge", "Visit the Santo Niño Shrine and Heritage Museum", "Spend an afternoon by the waterfront"],
    note: "Check access and transport options before setting out for the strait.",
  },
  {
    slug: "laoag",
    name: "Laoag",
    country: "Philippines",
    region: "Ilocos Norte",
    tag: "Old streets and open dunes",
    interests: ["Culture", "Adventure"],
    image: "/images/laoag.jpg",
    alt: "",
    description: "Pair a walk through Laoag's heritage center with a visit to the La Paz Sand Dunes.",
    highlights: ["See St. William's Cathedral and its bell tower", "Explore the city center on foot", "Spend time at the La Paz Sand Dunes"],
    note: "Confirm guide availability if you plan to book an activity at the dunes.",
  },
];

export async function getDestinationsWithImages() {
  const files = await readdir(join(process.cwd(), "public", "images"), {
    withFileTypes: true,
  });
  const availableImages = new Set(files.filter((file) => file.isFile()).map((file) => file.name));

  return destinations.map((destination) => ({
    ...destination,
    image: availableImages.has(basename(destination.image)) ? destination.image : null,
  }));
}
