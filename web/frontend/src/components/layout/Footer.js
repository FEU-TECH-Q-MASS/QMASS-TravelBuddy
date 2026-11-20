import Link from "next/link";
import Logo from "./Logo";
import Icon from "@/components/Icon";
import { newTripPath } from "@/lib/tripPlannerNavigation";
export default function Footer({ isAdmin, isTraveler, isSignedIn, loading, homeHref, copyrightYear }) {
  return (
    <footer className="border-t border-slate-100 bg-slate-50 pt-14">
      <div className="page-width grid gap-10 pb-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo href={homeHref} />
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
            A little planning. A world of possibility.
            <br />
            Your next adventure starts with a plan that feels like you.
          </p>
        </div>
        <div>
          <h2 className="footer-heading">Discover</h2>
          <div className="footer-links">
            {isAdmin ? (
              <>
                <Link href="/dashboard">Admin dashboard</Link>
                <Link href="/admin/users">Manage users</Link>
                <Link href="/admin/support-messages">Support messages</Link>
                <Link href="/account">My account</Link>
              </>
            ) : (
              <>
                <Link href="/explore">Explore destinations</Link>
                <Link href="/how-it-works">How it works</Link>
                {isTraveler ? <Link href={newTripPath}>Plan a trip</Link> : <Link href="/#plan-trip">Start planning</Link>}
              </>
            )}
          </div>
        </div>
        <div>
          <h2 className="footer-heading">TravelBuddy</h2>
          <div className="footer-links">
            {isAdmin ? (
              <>
                <Link href={homeHref}>Public site</Link>
                <Link href="/contact">Contact support</Link>
              </>
            ) : (
              <>
                <Link href="/about">About the project</Link>
                <Link href="/contact">Contact us</Link>
                {isSignedIn ? (
                  <Link href="/dashboard">Dashboard</Link>
                ) : !loading && <Link href="/login">Log in</Link>}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="page-width flex flex-col justify-between gap-3 border-t border-slate-200 py-6 text-xs text-slate-500 sm:flex-row">
        <p>© {copyrightYear} TravelBuddy · A Q-MASS project</p>
        <p className="flex items-center gap-2">
          <Icon name="globe" size={14} /> Made for curious travelers.
        </p>
      </div>
    </footer>
  );
}
