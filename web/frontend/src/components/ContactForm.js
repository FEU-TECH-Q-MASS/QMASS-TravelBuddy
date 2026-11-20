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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9">
      <h2 className="text-2xl font-semibold tracking-tight">What&apos;s on your mind?</h2>
      <form ref={formRef} onSubmit={submit} onChange={onChange} noValidate className="mt-6">
        <fieldset disabled={sending} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="field-label">Your name</label>
              <input {...fieldProps("name")} autoComplete="name" className="input" required maxLength={100} />
              <FieldError field="name" errors={errors} />
            </div>
            <div>
              <label htmlFor="contact-email" className="field-label">Email address</label>
              <input {...fieldProps("email")} autoComplete="email" type="email" className="input" required maxLength={254} />
              <FieldError field="email" errors={errors} />
            </div>
          </div>
          <div>
            <label htmlFor="contact-topic" className="field-label">Topic</label>
            <select {...fieldProps("topic")} className="input" required>
              <option value="">Choose a topic</option>
              {topics.map((topic) => <option key={topic}>{topic}</option>)}
            </select>
            <FieldError field="topic" errors={errors} />
          </div>
          <div>
            <label htmlFor="contact-message" className="field-label">Your message</label>
            <textarea {...fieldProps("message", "contact-message-hint")} className="input min-h-36 resize-y" rows={5} required minLength={10} maxLength={2000} />
            <div id="contact-message-hint" className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-600">
              <span>10–2,000 characters. Please avoid sharing sensitive information.</span>
              <span>{length.toLocaleString("en-PH")} / 2,000</span>
            </div>
            <FieldError field="message" errors={errors} />
          </div>
          <button type="submit" className="btn btn-dark disabled:opacity-60">
            {sending ? "Sending…" : "Send message"} <Icon name="mail" size={17} />
          </button>
        </fieldset>
      </form>
      {notice && <p className="notice mt-6" role={notice.success ? "status" : "alert"}>{notice.text}</p>}
    </div>
  );
}
