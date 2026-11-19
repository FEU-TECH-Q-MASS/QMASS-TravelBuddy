"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

const passwordRules = [
  (value) => value.length >= 8,
  (value) => /[A-Z]/.test(value) && /[a-z]/.test(value),
  (value) => /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value),
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (mounted && event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (mounted && sessionData.session) setReady(true);
    });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!passwordRules.every((rule) => rule(password))) {
      setNotice("Your password must meet all password requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setNotice("Your passwords must match.");
      return;
    }
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ password });
      if (error) throw error;
      router.push("/login?reset=success");
    } catch (error) {
      setNotice(error.message || "Unable to update your password.");
    }
  }

  return (
    <section className="page-width section-space max-w-xl">
      <p className="eyebrow">Account security</p>
      <h1 className="page-title">Choose a new password.</h1>
      {!ready ? (
        <p className="notice mt-8">Open this page from your password reset email.</p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl border p-6">
          <label className="field-label">New password<input className="input mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <label className="field-label">Confirm password<input className="input mt-2" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
          <button className="btn btn-primary w-full">Update password</button>
          {notice && <p className="notice">{notice}</p>}
        </form>
      )}
      <Link href="/login" className="text-link mt-6">Back to login</Link>
    </section>
  );
}
