"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import Footer from "./Footer";
import Navbar from "./Navbar";

const SiteAuth = createContext(null);

export function useSiteAuth() {
  return useContext(SiteAuth);
}

export default function AppShell({ children, copyrightYear }) {
  const { user, loading, logout } = useAuth();
  const userId = user?.id;
  const pathname = usePathname();
  const router = useRouter();
  const signingOut = useRef(false);
  const [profileResult, setProfileResult] = useState(null);
  const current = profileResult?.userId === userId ? profileResult : null;
  const profile = current?.profile;
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    api("/me", { cache: "no-store", signal: controller.signal })
      .then(({ user: profile }) => {
        if (!controller.signal.aborted) setProfileResult({ userId, pathname, profile });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setProfileResult({ userId, pathname, error: error.message });
      });
    return () => controller.abort();
  }, [userId, pathname]);

  useEffect(() => {
    if (pathname === "/") signingOut.current = false;
  }, [pathname]);

  async function signOut() {
    signingOut.current = true;
    await logout();
    router.replace("/");
  }

  const auth = {
    user,
    loading,
    profile,
    profileLoading: !!userId && current?.pathname !== pathname,
    profileError: current?.error,
    signingOut,
    signOut,
  };

  return (
    <SiteAuth.Provider value={auth}>
      <Navbar user={user} isAdmin={isAdmin} onLogout={signOut} />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <Footer isAdmin={isAdmin} copyrightYear={copyrightYear} />
    </SiteAuth.Provider>
  );
}
