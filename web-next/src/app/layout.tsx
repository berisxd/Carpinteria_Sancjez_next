import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartFloatingButton } from "@/components/cart/CartFloatingButton";
import { CartProvider } from "@/components/cart/CartProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carpintería Sánchez",
  description: "Muebles a medida y proyectos de carpintería artesanal",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
          <CartFloatingButton />
        </CartProvider>
      </body>
    </html>
  );
}
