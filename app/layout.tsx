import type { Metadata } from "next";
import { Noto_Serif, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ZURI — Trouve ta Zuriste de confiance",
  description:
    "ZURI met en relation les clientes et les meilleures Zuristes beauté au Gabon : coiffure, ongles, regard et maquillage.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body className="bg-white text-cacao font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
