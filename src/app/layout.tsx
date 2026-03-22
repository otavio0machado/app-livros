import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import CartButton from "@/components/CartButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Livros & Apostilas",
  description: "Livros e apostilas usados com preço justo. Compre via WhatsApp!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-geist-sans)] bg-white text-gray-900">
        <CartProvider>
          {children}
          <CartButton />
        </CartProvider>
      </body>
    </html>
  );
}
