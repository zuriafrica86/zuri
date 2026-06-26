"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

const items = [
  { href: "/admin", label: "Vue d'ensemble", icon: "📊" },
  { href: "/admin/zuristes", label: "Zuristes", icon: "👤" },
  { href: "/admin/rdv", label: "Rendez-vous", icon: "📅" },
  { href: "/admin/contacts", label: "Contacts", icon: "💬" },
  { href: "/admin/clientes", label: "Clientes", icon: "🧑" },
  { href: "/admin/comptes", label: "Comptes", icon: "⚙️" },
];

export function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className="w-48 shrink-0 border-r border-sable bg-white p-4 md:w-56">
      <div className="mb-6 px-1">
        <Logo />
      </div>
      <nav className="space-y-1">
        {items.map((it) => {
          const active =
            it.href === "/admin"
              ? path === "/admin"
              : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                active
                  ? "flex items-center gap-3 rounded-xl2 bg-cacao px-3 py-2.5 text-sm font-medium text-ivoire"
                  : "flex items-center gap-3 rounded-xl2 px-3 py-2.5 text-sm text-cacao/70 transition hover:bg-rose/30"
              }
            >
              <span aria-hidden>{it.icon}</span> {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
