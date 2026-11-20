import "./globals.css";
import AppShell from "@/components/layout/AppShell";

export const metadata = {
  title: { default: "TravelBuddy", template: "%s | TravelBuddy" },
  description:
    "Plan travel around your destination, dates, interests, and budget.",
  icons: {
    icon: { url: "/images/TravelBuddy_Favicon.png", type: "image/png" },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <AppShell copyrightYear={new Date().getFullYear()}>{children}</AppShell>
      </body>
    </html>
  );
}
