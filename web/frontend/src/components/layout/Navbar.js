"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Logo from "./Logo";
import Icon from "@/components/Icon";
import { useAuth } from "@/hooks/useAuth";
const publicLinks = [
  ["/", "Home"],
  ["/explore", "Explore"],
  ["/how-it-works", "How It Works"],
  ["/about", "About"],
  ["/contact", "Contact"],
];
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const toggle = useRef(null);
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
  async function handleLogout() { await logout(); router.push("/"); }
  const accountAction = user ? <><Link href="/dashboard" className="btn btn-outline hidden lg:inline-flex">Dashboard</Link><button type="button" onClick={handleLogout} className="btn btn-primary hidden lg:inline-flex">Log Out <Icon size={17} /></button></> : <Link href="/login" className="btn btn-primary hidden lg:inline-flex">Log In <Icon size={17} /></Link>;
  return (
    <header className="site-header" onKeyDown={onKeyDown}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="page-width flex min-h-22 items-center justify-between gap-8">
        <Logo onClick={closeMenu} />
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 lg:flex"
        >
          {publicLinks.map(([href, label]) => (
            <Link
              key={href}
              href={href}
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
          {publicLinks.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenu}
              aria-current={pathname === href ? "page" : undefined}
              className={`block rounded-lg px-3 py-3 font-medium ${isActive(href) ? "bg-cyan-50 text-cyan-800" : "text-slate-700"}`}
            >
              {label}
            </Link>
          ))}
          {user ? <><Link href="/dashboard" onClick={closeMenu} className="btn btn-outline mt-3 w-full">Dashboard</Link><button type="button" onClick={() => { closeMenu(); handleLogout(); }} className="btn btn-primary mt-3 w-full">Log Out <Icon size={17} /></button></> : <Link href="/login" onClick={closeMenu} className="btn btn-primary mt-3 w-full">Log In <Icon size={17} /></Link>}
        </nav>
      )}
    </header>
  );
}
