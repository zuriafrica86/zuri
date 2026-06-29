"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  CalendarDays,
  MessageCircle,
  Rocket,
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
  { href: "/admin/boosts", label: "Mises en avant", Icon: Rocket },
  { href: "/admin/contacts", label: "Contacts", Icon: MessageCircle },
  { href: "/admin/clientes", label: "Clientes", Icon: User },
  { href: "/admin/comptes", label: "Comptes", Icon: Settings },
];

export function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className="shrink-0 border-b border-sable bg-white md:w-56 md:border-b-0 md:border-r">
      <div className="px-5 pt-4 md:pb-2">
        <Logo />
      </div>
      <nav className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 md:flex-col md:gap-1 md:px-3.5 md:pb-4 md:pt-3">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/admin" ? path === "/admin" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl2 bg-cacao px-3.5 py-2.5 text-sm font-medium text-ivoire shadow-soft transition duration-250 ease-soft"
                  : "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl2 px-3.5 py-2.5 text-sm text-cacao/70 transition duration-250 ease-soft hover:bg-rose/30 hover:text-cacao"
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
