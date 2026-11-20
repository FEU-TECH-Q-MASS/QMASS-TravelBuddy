"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { topics, validateContact } from "../../../contact-validation.cjs";

function FieldError({ field, errors }) {
  return errors[field] && <p id={"contact-" + field + "-error"} className="mt-1 text-sm text-red-700">{errors[field]}</p>;
}

export default function ContactForm() {
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [sending, setSending] = useState(false);
  const [length, setLength] = useState(0);
  const submitting = useRef(false);
  const attempt = useRef(null);
  const formRef = useRef(null);
  const invalidField = useRef(null);

  useEffect(() => {
    if (sending || !invalidField.current) return;
    formRef.current?.elements.namedItem(invalidField.current)?.focus();
    invalidField.current = null;
  }, [errors, sending]);

  function fieldProps(field, hint) {
    return {
      id: "contact-" + field,
      name: field,
      "aria-invalid": Boolean(errors[field]),
      "aria-describedby": [errors[field] && "contact-" + field + "-error", hint].filter(Boolean).join(" ") || undefined,
    };
  }

  function showErrors(fieldErrors) {
    invalidField.current = Object.keys(fieldErrors)[0];
    setErrors(fieldErrors);
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const { values, errors: fieldErrors } = validateContact(Object.fromEntries(new FormData(form)));
    setNotice(null);
    if (Object.keys(fieldErrors).length) return showErrors(fieldErrors);

    setErrors({});
    submitting.current = true;
    setSending(true);
    try {
      const payload = JSON.stringify(values);
      if (attempt.current?.payload !== payload) {
        attempt.current = { payload, id: crypto.randomUUID() };
      }
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, id: attempt.current.id }),
      });
      const result = await response.json().catch(() => null);
      if (response.status === 409) attempt.current = null;
      if (response.status === 400 && Object.keys(result?.error?.fields || {}).length) {
        showErrors(result.error.fields);
        return;
      }
      if (!response.ok || result?.received !== true) {
        setNotice({ text: result?.error?.message || "We could not confirm your submission. Please try again." });
        return;
      }
      form.reset();
      attempt.current = null;
      setLength(0);
      setNotice({ success: true, text: "Your message was sent to the TravelBuddy team." });
    } catch {
      setNotice({ text: "We could not confirm your submission. Please try again." });
    } finally {
      submitting.current = false;
      setSending(false);
    }
  }

  function onChange(event) {
    const { name, value } = event.target;
    if (name === "message") setLength(value.length);
    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: undefined }));
    }
    setNotice(null);
  }

  return (
    <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-brand-700 uppercase">We&apos;re listening</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-900">Send us a message.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">Share a little detail so we can understand how to help.</p>
        </div>
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 sm:inline-flex"><Icon name="mail" size={21} /></span>
      </div>
      <form ref={formRef} onSubmit={submit} onChange={onChange} noValidate className="mt-6">
        <p className="mb-5 text-[11px] text-slate-400">All fields are required.</p>
        <fieldset disabled={sending} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="field-label">Your name</label>
              <input {...fieldProps("name")} autoComplete="name" placeholder="Your full name" className="input aria-invalid:border-red-400 aria-invalid:bg-red-50/40" required maxLength={100} />
              <FieldError field="name" errors={errors} />
            </div>
            <div>
              <label htmlFor="contact-email" className="field-label">Email address</label>
              <input {...fieldProps("email")} autoComplete="email" type="email" placeholder="you@example.com" className="input aria-invalid:border-red-400 aria-invalid:bg-red-50/40" required maxLength={254} />
              <FieldError field="email" errors={errors} />
            </div>
          </div>
          <div>
            <label htmlFor="contact-topic" className="field-label">Topic</label>
            <select {...fieldProps("topic")} className="input aria-invalid:border-red-400 aria-invalid:bg-red-50/40" required>
              <option value="">Choose a topic</option>
              {topics.map((topic) => <option key={topic}>{topic}</option>)}
            </select>
            <FieldError field="topic" errors={errors} />
          </div>
          <div>
            <label htmlFor="contact-message" className="field-label">Your message</label>
            <textarea {...fieldProps("message", "contact-message-hint")} placeholder="Tell us about your question or idea…" className="input min-h-44 resize-y leading-7 aria-invalid:border-red-400 aria-invalid:bg-red-50/40" rows={6} required minLength={10} maxLength={2000} />
            <div id="contact-message-hint" className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-600">
              <span className="max-w-72 text-[11px] leading-5">10–2,000 characters. Please avoid sharing sensitive information.</span>
              <span className="text-[11px] tabular-nums">{length.toLocaleString("en-PH")} / 2,000</span>
            </div>
            <FieldError field="message" errors={errors} />
          </div>
          <button type="submit" className="btn btn-dark w-full disabled:cursor-wait disabled:opacity-60">
            {sending ? "Sending…" : "Send message"} <Icon name="arrow" size={17} />
          </button>
        </fieldset>
      </form>
      {notice && <div className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${notice.success ? "border-cyan-100 bg-brand-50 text-brand-900" : "border-red-200 bg-red-50 text-red-800"}`}>
        <Icon name={notice.success ? "check" : "mail"} size={18} className="mt-0.5 shrink-0" />
        <p className="min-w-0 flex-1 text-sm leading-6" role={notice.success ? "status" : "alert"}>{notice.text}</p>
        <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-black/5"><Icon name="close" size={16} /></button>
      </div>}
    </div>
  );
}
