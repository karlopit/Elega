"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { getApiErrorMessage, getBootstrapStatus } from "@/lib/api";

function routeForRole(role) {
  if (role === "admin") {
    return "/admin";
  }
  if (role === "staff") {
    return "/staff/men";
  }
  return "/shop";
}

const EMPTY_FORM = { email: "", password: "", full_name: "", setup_secret: "" };

export default function AccountPage() {
  const router = useRouter();
  const { signIn, status } = useStore();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    getBootstrapStatus()
      .then((data) => {
        if (data.needs_admin) {
          setMode("setup");
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
      })
      .finally(() => setCheckingSetup(false));
  }, []);

  useEffect(() => {
    setForm(EMPTY_FORM);
    setError("");
  }, [mode]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.email.includes("@") || form.password.length < 8) {
      setError("Use a valid email and a password with at least 8 characters.");
      return;
    }

    if ((mode === "register" || mode === "setup") && form.full_name.trim().length < 1) {
      setError("Enter your full name to create an account.");
      return;
    }

    try {
      const response = await signIn(form, mode);
      router.push(routeForRole(response.role));
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "We could not complete that account request. Please try again."));
    }
  }

  return (
    <main className="bg-paper px-5 py-16 lg:px-10">
      <section className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">Account</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-ink">
            Keep your fitting room ready.
          </h1>
          <p className="mt-5 text-base leading-8 text-muted">
            Sign in to sync cart items with the backend, place orders, and return to your selections.
          </p>
        </div>
        <form autoComplete="off" className="border border-line bg-ivory p-6 md:p-8" onSubmit={handleSubmit}>
          {checkingSetup ? (
            <p className="mb-8 text-sm text-muted">Checking setup status.</p>
          ) : null}

          {mode === "setup" ? (
            <div className="mb-8 border border-gold bg-paper px-4 py-3 text-sm leading-6 text-muted">
              Create the first admin account. After this succeeds, this setup path closes automatically.
            </div>
          ) : (
            <div className="mb-8 grid grid-cols-2 border border-line bg-paper p-1">
              {["login", "register"].map((item) => (
                <button
                  className={`focus-ring px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] ${
                    mode === item ? "bg-ink text-paper" : "text-muted"
                  }`}
                  key={item}
                  onClick={() => switchMode(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {mode === "register" || mode === "setup" ? (
            <label className="mb-5 block text-sm font-medium text-ink">
              Full name
              <input
                autoComplete="name"
                className="focus-ring mt-2 w-full border border-line bg-paper px-4 py-3 text-ink"
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                value={form.full_name}
              />
            </label>
          ) : null}
          {mode === "setup" ? (
            <label className="mb-5 block text-sm font-medium text-ink">
              Setup secret
              <input
                className="focus-ring mt-2 w-full border border-line bg-paper px-4 py-3 text-ink"
                onChange={(event) => setForm({ ...form, setup_secret: event.target.value })}
                autoComplete="new-password"
                placeholder="Leave blank if not configured"
                type="password"
                value={form.setup_secret}
              />
            </label>
          ) : null}
          <label className="mb-5 block text-sm font-medium text-ink">
            Email
            <input
              autoComplete="username"
              className="focus-ring mt-2 w-full border border-line bg-paper px-4 py-3 text-ink"
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              type="email"
              value={form.email}
            />
          </label>
          <label className="mb-6 block text-sm font-medium text-ink">
            Password
            <input
              autoComplete="new-password"
              className="focus-ring mt-2 w-full border border-line bg-paper px-4 py-3 text-ink"
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              type="password"
              value={form.password}
            />
          </label>
          {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
          {status.message ? <p className="mb-4 text-sm text-muted">{status.message}</p> : null}
          <button className="focus-ring w-full border border-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-ink transition hover:text-gold" type="submit">
            {mode === "setup" ? "Create first admin" : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}
