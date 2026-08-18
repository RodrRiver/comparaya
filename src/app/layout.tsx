import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "ComparaYa — Compara precios de electrónica en El Salvador",
    template: "%s | ComparaYa",
  },
  description:
    "Encuentra el mejor precio en celulares, laptops, tablets, TVs y más. Compara precios entre tiendas de El Salvador y recibe alertas cuando baje el precio.",
  keywords: [
    "comparar precios",
    "electrónica El Salvador",
    "celulares El Salvador",
    "laptops baratas",
    "precio más bajo",
    "Siman",
    "RadioShack",
    "Omnisport",
    "La Curacao",
    "Office Depot",
    "Zona Digital",
    "Aeon Computers",
    "Intelmax",
  ],
  openGraph: {
    title: "ComparaYa — Compara precios de electrónica en El Salvador",
    description:
      "Encuentra el mejor precio en celulares, laptops, tablets, TVs y más en 8 tiendas de El Salvador.",
    type: "website",
    locale: "es_SV",
    siteName: "ComparaYa",
  },
  metadataBase: new URL("https://comparaya-193638896472.us-central1.run.app"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
