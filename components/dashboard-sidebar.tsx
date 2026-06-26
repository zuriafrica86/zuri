"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Scissors,
  Images,
  CalendarDays,
  Calendar,
  Clock,
  Wallet,
  Lock,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";

type Item = { href: string; label: string; Icon: LucideIcon };

const ZURISTE: Item[] = [
  { href: "/dashboard", label: "Tableau de bord", Icon: LayoutDashboard },
  { href: "/dashboard/profil", label: "Mon profil", Icon: User },
  { href: "/dashboard/services", label: "Mes services", Icon: Scissors },
  { href: "/dashboard/portfolio", label: "Mon portfolio", Icon: Images },
  { href: "/dashboard/disponibilites", label: "Disponibilités", Icon: Clock },
  { href: "/dashboard/rdv", label: "Demandes reçues", Icon: CalendarDays },
  { href: "/dashboard/agenda", label: "Agenda", Icon: Calendar },
  { href: "/dashboard/credit", label: "Crédit Zuri", Icon: Wallet },
  { href: "/dashboard/securite", label: "Sécurité", Icon: Lock },
];

const CLIENTE: Item[] = [
  { href: "/dashboard", label: "Tableau de bord", Icon: LayoutDashboard },
  { href: "/recherche", label: "Trouver une Zuriste", Icon: Search },
  { href: "/modeles", label: "Bibliothèque", Icon: Images },
  { href: "/dashboard/mes-rdv", label: "Mes rendez-vous", Icon: CalendarDays },
  { href: "/dashboard/securite", label: "Sécurité", Icon: Lock },
];

const ADMIN: Item[] = [
  { href: "/dashboard", label: "Tableau de bord", Icon: LayoutDashboard },
  { href: "/admin", label: "Administration", Icon: LayoutDashboard },
  { href: "/dashboard/securite", label: "Sécurité", Icon: Lock },
];

export function DashboardSidebar({ role }: { role: string }) {
  const path = usePathname();
  const items =
    role === "prestataire" ? ZURISTE : role === "admin" ? ADMIN : CLIENTE;

  return (
    <aside className="shrink-0 border-b border-sable bg-white md:w-56 md:border-b-0 md:border-r">
      <div className="px-4 pt-4 md:pb-2">
        <Logo />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-4 md:pb-4 md:pt-2">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/dashboard"
              ? path === "/dashboard"
              : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={
                active
                  ? "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl2 bg-cacao px-3 py-2.5 text-sm font-medium text-ivoire"
                  : "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl2 px-3 py-2.5 text-sm text-cacao/70 transition hover:bg-rose/30"
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
