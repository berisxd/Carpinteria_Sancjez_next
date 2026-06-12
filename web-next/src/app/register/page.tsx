"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const nombre = String(formData.get("nombre") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const confirmar = String(formData.get("confirmar") || "");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre, email, password }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "No se pudo crear la cuenta.");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/",
    });

    router.push("/");
  }

  return (
    <div className="cs-page">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="cs-hero p-6 sm:p-8">
            <div className="cs-hero-panel p-5 sm:p-6">
              <h1 className="text-3xl font-extrabold text-white">Crear cuenta</h1>
              <p className="mt-3 text-sm text-blue-50/95">
                Regístrate para guardar tus datos y agilizar tus próximos pedidos.
              </p>
            </div>
          </section>

          <section className="cs-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[var(--brand-700)]">Registro</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Completa tus datos para comenzar.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-[var(--brand-700)]">
                Nombre completo
                <input name="nombre" required className="cs-input" />
              </label>

              <label className="block text-sm font-medium text-[var(--brand-700)]">
                Email
                <input name="email" type="email" required className="cs-input" />
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

              <label className="block text-sm font-medium text-[var(--brand-700)]">
                Confirmar contraseña
                <input
                  name="confirmar"
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
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>

            <p className="mt-5 text-sm text-[var(--muted)]">
              ¿Ya tienes cuenta? <Link href="/login" className="cs-link">Iniciar sesión</Link>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
