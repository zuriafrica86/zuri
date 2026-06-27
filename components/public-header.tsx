"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";

const LINKS = [
  { href: "/recherche", label: "Trouver une Zuriste" },
  { href: "/aide", label: "Besoin d'aide ?" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-50">
      <div className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/" aria-label="Accueil Zuri">
          <Logo />
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-5 text-sm md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-medium text-cacao/70 hover:text-cacao"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="font-medium text-cacao/70 hover:text-cacao"
          >
            Me connecter
          </Link>
          <Link
            href="/signup"
            className="rounded-xl2 bg-cacao px-4 py-2 font-medium text-ivoire hover:bg-cacao/90"
          >
            M&apos;inscrire
          </Link>
        </nav>

        {/* Bouton hamburger (mobile) */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="rounded-lg p-2 text-cacao transition hover:bg-rose/30 md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Panneau mobile : animation douce (opacité + glissement, easing) */}
      <div
        className={`absolute inset-x-0 top-full z-50 transform transition duration-300 ease-out md:hidden ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <nav className="mx-4 mt-1 rounded-xl2 border border-sable bg-ivoire p-2 shadow-soft">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-4 py-3 font-medium text-cacao/80 hover:bg-rose/30"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-4 py-3 font-medium text-cacao/80 hover:bg-rose/30"
          >
            Me connecter
          </Link>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl2 bg-cacao px-4 py-3 text-center font-medium text-ivoire hover:bg-cacao/90"
          >
            M&apos;inscrire
          </Link>
        </nav>
      </div>
    </header>
  );
}
