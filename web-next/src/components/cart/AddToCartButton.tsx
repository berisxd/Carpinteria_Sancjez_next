"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

interface AddToCartButtonProps {
  product: {
    id: string;
    nombre: string;
    imagen: string;
    precio: number;
    categoria: {
      nombre: string;
      slug: string;
    };
  };
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    addItem(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full rounded-lg bg-[var(--accent)] px-6 py-3 text-center font-semibold text-white shadow-md transition hover:brightness-95"
    >
      {justAdded ? "Agregado al carrito" : "Agregar al carrito"}
    </button>
  );
}