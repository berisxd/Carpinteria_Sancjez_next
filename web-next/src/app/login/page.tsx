"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const callbackUrl = searchParams.get("callbackUrl") || "";

    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl || "/",
    });

    if (!response || response.error) {
      setError("Credenciales invalidas");
      setLoading(false);
      return;
    }

    try {
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const session = (await sessionResponse.json()) as {
        user?: {
          role?: string;
        };
      };

      if (callbackUrl) {
        router.push(callbackUrl);
        return;
      }

      if (session.user?.role === "ADMIN") {
        router.push("/admin");
        return;
      }

      router.push("/");
    } catch {
      router.push(callbackUrl || "/");
    }
  }

  return (
    <div className="cs-page">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="cs-hero p-6 sm:p-8">
            <div className="cs-hero-panel p-5 sm:p-6">
              <h1 className="text-3xl font-extrabold text-white">Bienvenido</h1>
              <p className="mt-3 text-sm text-blue-50/95">
                Accede a tu cuenta para continuar con tus pedidos y cotizaciones en Carpintería Sánchez.
              </p>
            </div>
          </section>

          <section className="cs-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[var(--brand-700)]">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Ingresa con tu correo y contraseña.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-[var(--brand-700)]">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  className="cs-input"
                />
              </label>

              <label className="block text-sm font-medium text-[var(--brand-700)]">
                Contraseña
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="cs-input"
                />
              </label>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            <p className="mt-5 text-sm text-[var(--muted)]">
              ¿No tienes cuenta? <Link href="/register" className="cs-link">Crear cuenta</Link>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="cs-page">
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm text-[var(--muted)]">Cargando...</p>
          </main>
          <SiteFooter />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
