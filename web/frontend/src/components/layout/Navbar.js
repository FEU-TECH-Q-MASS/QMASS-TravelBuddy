"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import Logo from "./Logo";
import Icon from "@/components/Icon";
import { newTripPath } from "@/lib/tripPlannerNavigation";
const publicLinks = [
  ["/", "Home"],
  ["/explore", "Explore"],
  ["/how-it-works", "How It Works"],
  ["/about", "About"],
  ["/contact", "Contact"],
];
const adminLinks = [
  ["/dashboard", "Admin Dashboard"],
  ["/admin/users", "Manage Users"],
  ["/admin/support-messages", "Support Messages"],
  ["/account", "My Account"],
];
const travelerLinks = [...publicLinks.slice(0, 2), [newTripPath, "Plan a Trip"], ...publicLinks.slice(2)];

export default function Navbar({ user, isAdmin, isTraveler, homeHref, onLogout }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  const navigation = isAdmin ? adminLinks : isTraveler ? travelerLinks : publicLinks;
  const isActive = (href) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  function closeMenu() {
    setOpen(false);
  }
  function onKeyDown(event) {
    if (event.key === "Escape" && open) {
      closeMenu();
      toggle.current?.focus();
    }
  }
  const accountAction = user ? <>{!isAdmin && <Link href="/dashboard" className="btn btn-outline hidden lg:inline-flex">Dashboard</Link>}<button type="button" onClick={onLogout} className="btn btn-primary hidden lg:inline-flex">Log Out <Icon size={17} /></button></> : <Link href="/login" className="btn btn-primary hidden lg:inline-flex">Log In <Icon size={17} /></Link>;
  return (
    <header className="site-header" onKeyDown={onKeyDown}>
      <a className="skip-link" href="#main-content">
        Skip to Content
      </a>
      <div className="page-width flex min-h-22 items-center justify-between gap-8">
        <Logo href={homeHref} onClick={closeMenu} />
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 lg:flex"
        >
          {navigation.map(([href, label]) => (
            <Link
              key={href}
              href={href === "/" ? homeHref : href}
              aria-current={pathname === href ? "page" : undefined}
              className={`nav-link ${isActive(href) ? "active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">{accountAction}</div>
        <button
          type="button"
          ref={toggle}
          className="rounded-lg border border-slate-200 p-3 lg:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="page-width border-t border-slate-100 py-5 lg:hidden"
        >
          {navigation.map(([href, label]) => (
            <Link
              key={href}
              href={href === "/" ? homeHref : href}
              onClick={closeMenu}
              aria-current={pathname === href ? "page" : undefined}
              className={`block rounded-lg px-3 py-3 font-medium ${isActive(href) ? "bg-cyan-50 text-cyan-800" : "text-slate-700"}`}
            >
              {label}
            </Link>
          ))}
          {user ? <>{!isAdmin && <Link href="/dashboard" onClick={closeMenu} className="btn btn-outline mt-3 w-full">Dashboard</Link>}<button type="button" onClick={() => { closeMenu(); onLogout(); }} className="btn btn-primary mt-3 w-full">Log Out <Icon size={17} /></button></> : <Link href="/login" onClick={closeMenu} className="btn btn-primary mt-3 w-full">Log In <Icon size={17} /></Link>}
        </nav>
      )}
    </header>
  );
}
