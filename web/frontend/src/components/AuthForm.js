"use client";
import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import { api, saveToken } from "@/lib/api";
import { useRouter } from "next/navigation";
const passwordRules = [
  ["At least 8 characters", (value) => value.length >= 8],
  [
    "An uppercase and a lowercase letter",
    (value) => /[A-Z]/.test(value) && /[a-z]/.test(value),
  ],
  [
    "A number and a symbol",
    (value) => /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value),
  ],
];

export default function AuthForm({ mode }) {
  const signup = mode === "signup";
  const recovery = mode === "recovery";
  const [visible, setVisible] = useState({
    password: false,
    confirmPassword: false,
  });
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  function submit(event) {
    event.preventDefault();
    if (loading) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const nextErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      nextErrors.email = "Enter a valid email address.";
    if (!recovery && !values.password)
      nextErrors.password = "Enter your password.";
    if (signup) {
      if (!values.firstName.trim())
        nextErrors.firstName = "Enter your first name.";
      if (!values.lastName.trim())
        nextErrors.lastName = "Enter your last name.";
      if (!passwordRules.every(([, rule]) => rule(values.password)))
        nextErrors.password = "Your password must meet the requirements below.";
      if (!values.confirmPassword || values.password !== values.confirmPassword)
        nextErrors.confirmPassword = "Your passwords must match.";
    }
    setErrors(nextErrors);
    setNotice("");
    if (Object.keys(nextErrors).length) {
      form.elements.namedItem(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    const request = recovery
      ? api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: values.email }) })
      : api(`/auth/${signup ? "register" : "login"}`, { method: "POST", body: JSON.stringify(signup ? { name: `${values.firstName} ${values.lastName}`, email: values.email, password: values.password } : { email: values.email, password: values.password }) });
    setLoading(true);
    request
      .then((result) => {
        if (result?.token) {
          saveToken(result.token);
          router.push("/");
        } else if (result?.resetToken) {
          router.push(`/reset-password?token=${encodeURIComponent(result.resetToken)}`);
        } else {
          setNotice(result.message || "Request completed.");
        }
      })
      .catch((error) => setNotice(error.message))
      .finally(() => setLoading(false));
    if (!recovery) {
      form.elements.namedItem("password").value = "";
      setPassword("");
    }
    if (signup) form.elements.namedItem("confirmPassword").value = "";
    setVisible({ password: false, confirmPassword: false });
  }
  function field(name, label, type = "text", autoComplete) {
    const isPassword = type === "password";
    return (
      <div>
        <label htmlFor={name} className="field-label">
          {label}
        </label>
        <div className="relative">
          <input
            id={name}
            name={name}
            type={isPassword && visible[name] ? "text" : type}
            autoComplete={autoComplete}
            required
            maxLength={isPassword ? 128 : name === "email" ? 254 : 100}
            className={`input ${isPassword ? "pr-12" : ""}`}
            placeholder={type === "email" ? "you@example.com" : label}
            aria-invalid={Boolean(errors[name])}
            aria-describedby={
              [
                errors[name] ? `${name}-error` : "",
                signup && name === "password" ? "password-guidance" : "",
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            onChange={
              name === "password" && signup
                ? (event) => {
                    setPassword(event.target.value);
                    setNotice("");
                  }
                : () => setNotice("")
            }
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setVisible({ ...visible, [name]: !visible[name] })}
              className="absolute top-1 right-1 rounded-lg p-3 text-slate-500 hover:text-brand-700"
              aria-label={`${visible[name] ? "Hide" : "Show"} ${label.toLowerCase()}`}
              aria-pressed={Boolean(visible[name])}
            >
              <Icon name={visible[name] ? "eyeOff" : "eye"} size={18} />
            </button>
          )}
        </div>
        {errors[name] && (
          <p id={`${name}-error`} className="mt-2 text-xs text-red-700">
            {errors[name]}
          </p>
        )}
      </div>
    );
  }
  return (
    <>
      <p className="eyebrow">
        {recovery
          ? "A fresh start"
          : signup
            ? "Start a new chapter"
            : "Your next adventure awaits"}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-brand-900">
        {recovery
          ? "Forgot your password?"
          : signup
            ? "Create your account."
            : "Welcome back."}
      </h1>
      <p className="mt-4 text-sm leading-6 text-slate-500">
        {recovery ? (
          "Enter the email address associated with your account."
        ) : signup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-link">
              Log in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-link">
              Sign up
            </Link>
          </>
        )}
      </p>
      <div className="notice mt-7 text-xs">
        {recovery ? "We will prepare a reset link for an account matching this email." : "Use your TravelBuddy account to save trips and manage preferences."}
      </div>
      <form onSubmit={submit} noValidate className="mt-7 space-y-5">
        {signup && (
          <div className="grid gap-4 sm:grid-cols-2">
            {field("firstName", "First name", "text", "given-name")}
            {field("lastName", "Last name", "text", "family-name")}
          </div>
        )}
        {field("email", "Email address", "email", "email")}
        {!recovery &&
          field(
            "password",
            "Password",
            "password",
            signup ? "new-password" : "current-password",
          )}
        {signup && (
          <>
            <ul
              id="password-guidance"
              className="space-y-2 text-xs text-slate-500"
            >
              {passwordRules.map(([label, rule]) => (
                <li
                  key={label}
                  className={`flex items-center gap-2 ${password && rule(password) ? "text-brand-700" : ""}`}
                >
                  <Icon
                    name={password && rule(password) ? "check" : "close"}
                    size={13}
                  />
                  {label}
                </li>
              ))}
            </ul>
            {field(
              "confirmPassword",
              "Confirm password",
              "password",
              "new-password",
            )}
          </>
        )}
        {!signup && !recovery && (
          <div className="text-right">
            <Link href="/forgot-password" className="text-link text-xs!">
              Forgot password?
            </Link>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Please wait…" : recovery ? "Send Recovery Request" : signup ? "Create Account" : "Log In"}{" "}
          {!loading && <Icon size={17} />}
        </button>
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
      </form>
      {recovery && (
        <Link href="/login" className="text-link mt-6">
          Back to login <Icon size={16} />
        </Link>
      )}
      <p className="mt-7 text-center text-[11px] leading-5 text-slate-400">
        Made for curious travelers. Built with thoughtful plans in mind.
      </p>
      {loading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/25 px-6 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex min-w-64 flex-col items-center rounded-2xl bg-white px-8 py-7 text-center shadow-2xl">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-brand-100 border-t-brand-700" aria-hidden="true" />
            <p className="mt-4 font-semibold text-brand-900">
              {recovery ? "Preparing your recovery link…" : signup ? "Creating your account…" : "Signing you in…"}
            </p>
            <p className="mt-1 text-sm text-slate-500">This should only take a moment.</p>
          </div>
        </div>
      )}
    </>
  );
}
