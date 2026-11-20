"use client";
import { useEffect, useState } from "react";
import { api, getToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api("/me")
      .then(({ user: value }) => setUser(value))
      .catch((error) => setNotice(error.message));
  }, [router]);

  if (!user) return <section className="page-width section-space">{notice || "Loading account…"}</section>;

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const form = new FormData(event.currentTarget);
      const { user: value } = await api("/me", {
        method: "PATCH",
        body: JSON.stringify({ display_name: form.get("display_name") }),
      });
      setUser(value);
      setNotice("Profile saved.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-width section-space">
      <p className="eyebrow">Account and preferences</p>
      <h1 className="page-title">Make it feel like your trip.</h1>
      <form onSubmit={save} className="mt-10 max-w-2xl space-y-5 rounded-3xl border p-6">
        <label className="field-label">
          Display name
          <input className="input mt-2" name="display_name" defaultValue={user.display_name || ""} maxLength={100} required />
        </label>
        <label className="field-label">
          Email
          <input className="input mt-2 bg-slate-50" value={user.email} readOnly />
        </label>
        <p className="text-sm text-slate-500">Role: {user.role || "traveler"}</p>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
        {notice && <p className="notice" role="status">{notice}</p>}
      </form>
    </section>
  );
}
