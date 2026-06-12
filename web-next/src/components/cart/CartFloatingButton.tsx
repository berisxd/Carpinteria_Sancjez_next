"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export function CartFloatingButton() {
  const { itemCount, hydrated } = useCart();

  return (
    <Link
      href="/checkout"
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-95"
    >
      <span>Carrito</span>
      <span className="rounded-full bg-white/20 px-2 py-1 text-xs">
        {hydrated ? itemCount : 0}
      </span>
    </Link>
  );
}