"use client";

import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="cs-navbar sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="cs-brand flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Logo Carpintería Sánchez"
            width={38}
            height={38}
            className="rounded-md border border-white/25 bg-white/95 p-0.5"
            priority
          />
          <span>
            Carpintería <span>Sánchez</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-semibold md:flex">
          <Link href="/" className="cs-nav-link">
            Inicio
          </Link>
          <Link href="/#catalogo" className="cs-nav-link">
            Catálogo
          </Link>
          <Link href="/cotizacion" className="cs-nav-link">
            Cotización
          </Link>
          <Link href="/#nosotros" className="cs-nav-link">
            Nosotros
          </Link>
          <Link href="/#contacto" className="cs-nav-link">
            Contacto
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/register" className="cs-btn-outline hidden md:inline-flex">
            Registrarse
          </Link>
          <Link href="/login" className="cs-btn-outline hidden sm:inline-flex">
            Iniciar sesión
          </Link>
          <Link href="/checkout" className="cs-btn-primary">
            Carrito
          </Link>
        </div>
      </div>
    </header>
  );
}
