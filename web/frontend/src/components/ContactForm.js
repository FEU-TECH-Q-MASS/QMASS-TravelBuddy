"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
export default function ContactForm() {
  const [review, setReview] = useState(null);
  function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setReview({
      ...data,
      name: data.name.trim(),
      message: data.message.trim(),
    });
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9">
      <h2 className="text-2xl font-semibold tracking-tight">
        What&apos;s on your mind?
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Questions, feedback, or an idea for the journey ahead.
      </p>
      <p className="notice mt-6 text-xs">
        Message delivery is not available yet. This form lets you review a
        message locally; it will not send or save your details.
      </p>
      <form
        onSubmit={submit}
        onChange={() => setReview(null)}
        className="mt-7 space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="field-label">
              Your name
            </label>
            <input
              id="contact-name"
              name="name"
              autoComplete="name"
              className="input"
              required
              maxLength={100}
              pattern=".*\S.*"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="field-label">
              Email address
            </label>
            <input
              id="contact-email"
              name="email"
              autoComplete="email"
              type="email"
              className="input"
              required
              maxLength={254}
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div>
          <label htmlFor="contact-topic" className="field-label">
            Topic
          </label>
          <select id="contact-topic" name="topic" className="input">
            <option>General question</option>
            <option>Project feedback</option>
            <option>Destination suggestion</option>
            <option>Something else</option>
          </select>
        </div>
        <div>
          <label htmlFor="contact-message" className="field-label">
            Your message
          </label>
          <textarea
            id="contact-message"
            name="message"
            className="input min-h-36 resize-y"
            rows={5}
            required
            minLength={10}
            maxLength={2000}
            onInput={(event) =>
              event.currentTarget.setCustomValidity(
                event.currentTarget.value.trim().length < 10
                  ? "Enter a message with at least 10 non-padding characters."
                  : "",
              )
            }
            placeholder="Tell us a little more…"
          />
          <p className="mt-2 text-xs text-slate-400">
            10–2,000 characters. Please avoid sharing sensitive information.
          </p>
        </div>
        <button type="submit" className="btn btn-dark">
          Review Message <Icon name="mail" size={17} />
        </button>
      </form>
      {review && (
        <div className="notice mt-6" role="status">
          <h3 className="font-semibold">Your message preview</h3>
          <p className="mt-2 text-xs">
            {review.name} · {review.email} · {review.topic}
          </p>
          <p className="mt-3 whitespace-pre-wrap wrap-break-word">
            {review.message}
          </p>
          <p className="mt-3 text-xs font-semibold">
            Not sent. Message delivery is not connected yet.
          </p>
        </div>
      )}
    </div>
  );
}
