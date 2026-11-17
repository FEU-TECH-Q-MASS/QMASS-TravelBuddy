import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
