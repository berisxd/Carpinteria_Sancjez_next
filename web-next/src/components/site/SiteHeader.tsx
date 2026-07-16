"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/#catalogo", label: "Catálogo" },
  { href: "/cotizacion", label: "Cotización" },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#contacto", label: "Contacto" },
];

export function SiteHeader() {
  const { data: session, status } = useSession();
  const isStaff = session?.user?.role === "ADMIN" || session?.user?.role === "WORKER";
  const isLogged = status === "authenticated";
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMenu() {
    setMobileOpen(false);
  }

  return (
    <header className="cs-navbar sticky top-0 z-40">
      {/* ── Main bar ─────────────────────────────────── */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5" onClick={closeMenu}>
          <Image
            src="/logo.png"
            alt="Logo Carpintería Sánchez"
            width={32}
            height={32}
            className="rounded-md"
            priority
          />
          <span className="cs-brand">
            Carpintería <span>Sánchez</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="cs-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {status === "loading" ? (
            <span className="hidden h-8 w-20 animate-pulse rounded-lg bg-slate-200 sm:block" />
          ) : isLogged ? (
            <>
              {isStaff && (
                <Link href="/admin" className="cs-btn-outline hidden md:inline-flex">
                  Panel admin
                </Link>
              )}
              <span className="hidden max-w-[120px] truncate text-xs text-[var(--muted)] md:block">
                {session.user?.name ?? session.user?.email}
              </span>
              <button
                onClick={() => void signOut({ callbackUrl: "/" })}
                className="cs-btn-outline hidden md:inline-flex"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/register" className="cs-btn-outline hidden md:inline-flex">
                Registrarse
              </Link>
              <Link href="/login" className="cs-btn-outline hidden sm:inline-flex">
                Iniciar sesión
              </Link>
            </>
          )}

          <Link href="/checkout" className="cs-btn-primary" onClick={closeMenu}>
            <CartIcon />
            Carrito
          </Link>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--bg)]"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ───────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-white shadow-lg">
          <div className="mx-auto max-w-6xl px-4 pb-5 pt-2 sm:px-6">
            <nav aria-label="Menú móvil">
              <ul className="divide-y divide-[var(--border)]">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block py-3 text-sm font-medium text-[var(--fg)] transition-colors hover:text-[var(--accent)]"
                      onClick={closeMenu}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-4 flex flex-col gap-2">
              {isLogged ? (
                <>
                  <p className="text-center text-xs text-[var(--muted)]">
                    {session?.user?.name ?? session?.user?.email}
                  </p>
                  {isStaff && (
                    <Link
                      href="/admin"
                      className="cs-btn-outline text-center"
                      onClick={closeMenu}
                    >
                      Panel admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      void signOut({ callbackUrl: "/" });
                      closeMenu();
                    }}
                    className="cs-btn-outline"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="cs-btn-primary text-center"
                    onClick={closeMenu}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="cs-btn-outline text-center"
                    onClick={closeMenu}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
