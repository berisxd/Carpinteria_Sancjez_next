"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

export interface CartItem {
  id: string;                    // product ID (for API lookup)
  cartKey: string;               // unique cart key: `${id}` or `${id}::${material}`
  nombre: string;
  imagen: string;
  precio: number;
  categoria: {
    nombre: string;
    slug: string;
  };
  materialSeleccionado?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
}

type CartAction =
  | { type: "hydrate"; payload: CartItem[] }
  | { type: "add"; payload: Omit<CartItem, "quantity"> }
  | { type: "remove"; payload: { cartKey: string } }
  | { type: "updateQuantity"; payload: { cartKey: string; quantity: number } }
  | { type: "clear" };

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
}

const STORAGE_KEY = "carpinteria-cart";

const CartContext = createContext<CartContextValue | null>(null);

function isValidCartItem(value: unknown): value is Omit<CartItem, "cartKey"> & { cartKey?: string } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  const categoria = item.categoria as Record<string, unknown> | undefined;

  return (
    typeof item.id === "string" &&
    typeof item.nombre === "string" &&
    typeof item.imagen === "string" &&
    typeof item.precio === "number" &&
    typeof item.quantity === "number" &&
    item.quantity > 0 &&
    !!categoria &&
    typeof categoria.nombre === "string" &&
    typeof categoria.slug === "string"
  );
}

function readStoredCart(): CartItem[] {
  const storedValue = window.localStorage.getItem(STORAGE_KEY);

  if (!storedValue || !storedValue.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue) as unknown;

    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    const safeItems = parsed
      .filter(isValidCartItem)
      .map((item) => ({
        ...item,
        // backward compat: generate cartKey if missing
        cartKey: item.cartKey ?? (item.materialSeleccionado ? `${item.id}::${item.materialSeleccionado}` : item.id),
      })) as CartItem[];

    if (safeItems.length !== parsed.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeItems));
    }

    return safeItems;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return {
        items: action.payload,
        hydrated: true,
      };
    case "add": {
      const existingItem = state.items.find((item) => item.cartKey === action.payload.cartKey);

      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.cartKey === action.payload.cartKey
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case "remove":
      return {
        ...state,
        items: state.items.filter((item) => item.cartKey !== action.payload.cartKey),
      };
    case "updateQuantity":
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.cartKey === action.payload.cartKey
              ? { ...item, quantity: action.payload.quantity }
              : item,
          )
          .filter((item) => item.quantity > 0),
      };
    case "clear":
      return {
        ...state,
        items: [],
      };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    hydrated: false,
  });

  useEffect(() => {
    try {
      dispatch({ type: "hydrate", payload: readStoredCart() });
    } catch {
      dispatch({ type: "hydrate", payload: [] });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Ignore write failures (quota/privacy mode) to avoid breaking page rendering.
    }
  }, [state.hydrated, state.items]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const total = state.items.reduce(
      (sum, item) => sum + item.precio * item.quantity,
      0,
    );

    return {
      items: state.items,
      hydrated: state.hydrated,
      itemCount,
      total,
      addItem: (item) => dispatch({ type: "add", payload: item }),
      removeItem: (cartKey) => dispatch({ type: "remove", payload: { cartKey } }),
      updateQuantity: (cartKey, quantity) =>
        dispatch({ type: "updateQuantity", payload: { cartKey, quantity } }),
      clearCart: () => dispatch({ type: "clear" }),
    };
  }, [state.hydrated, state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}