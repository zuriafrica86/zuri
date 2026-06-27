"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  CalendarDays,
  MessageCircle,
  User,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";

const items: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/admin", label: "Vue d'ensemble", Icon: LayoutDashboard },
  { href: "/admin/stats", label: "Statistiques", Icon: BarChart3 },
  { href: "/admin/zuristes", label: "Zuristes", Icon: Users },
  { href: "/admin/rdv", label: "Rendez-vous", Icon: CalendarDays },
  { href: "/admin/contacts", label: "Contacts", Icon: MessageCircle },
  { href: "/admin/clientes", label: "Clientes", Icon: User },
  { href: "/admin/comptes", label: "Comptes", Icon: Settings },
];

export function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className="w-48 shrink-0 border-r border-sable bg-white p-4 md:w-56">
      <div className="mb-6 px-1">
        <Logo />
      </div>
      <nav className="space-y-1">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/admin" ? path === "/admin" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={
                active
                  ? "flex items-center gap-3 rounded-xl2 bg-cacao px-3 py-2.5 text-sm font-medium text-ivoire"
                  : "flex items-center gap-3 rounded-xl2 px-3 py-2.5 text-sm text-cacao/70 transition hover:bg-rose/30"
              }
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
