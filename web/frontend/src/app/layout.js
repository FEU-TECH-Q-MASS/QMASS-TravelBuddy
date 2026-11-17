import "./globals.css";

export const metadata = {
  title: "TravelBuddy | Q-MASS",
  description: "Plan travel around your destination, dates, interests, and budget.",
  icons: {
    icon: { url: "/images/TravelBuddy_Favicon.png", type: "image/png" },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
