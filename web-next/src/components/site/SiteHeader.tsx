"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

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

  return (
    <header className="cs-navbar sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
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

        {/* Nav */}
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
              <span className="hidden max-w-[120px] truncate text-xs text-[var(--muted)] sm:block">
                {session.user?.name ?? session.user?.email}
              </span>
              <button
                onClick={() => void signOut({ callbackUrl: "/" })}
                className="cs-btn-outline hidden sm:inline-flex"
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
          <Link href="/checkout" className="cs-btn-primary">
            <CartIcon />
            Carrito
          </Link>
        </div>
      </div>
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
