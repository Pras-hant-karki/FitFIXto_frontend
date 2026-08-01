"use client";

import { ReactNode, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  CalendarDays,
  Users,
  Dumbbell,
  CalendarRange,
  Star,
  RotateCcw,
  UserRound,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts";

const trainerNav = [
  { label: "Orders", Icon: Box, href: "/trainer/dashboard" },
  { label: "Bookings", Icon: CalendarDays, href: "/trainer/bookings" },
  { label: "Clients", Icon: Users, href: "/trainer/clients" },
  { label: "Programs", Icon: Dumbbell, href: "/trainer/programs" },
  { label: "Slots", Icon: CalendarRange, href: "/trainer/slots" },
  { label: "To Review", Icon: Star, href: "/trainer/to-review" },
  { label: "Returns", Icon: RotateCcw, href: "/trainer/returns" },
  { label: "Profile", Icon: UserRound, href: "/trainer/profile" },
  { label: "Settings", Icon: Settings, href: "/trainer/settings" },
];

const getUserName = (firstName?: string, email?: string) => {
  if (firstName) return firstName;
  if (!email) return "trainer";
  return email.split("@")[0] || "trainer";
};

type TrainerDashboardShellProps = {
  children: ReactNode;
};

export function TrainerDashboardShell({ children }: TrainerDashboardShellProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const username = useMemo(() => getUserName(user?.firstName, user?.email), [user]);

  return (
    <section className="customer-dashboard-page">
      <header className="customer-dashboard-header">
        <h1>Welcome back, {username}.</h1>
        <p>Manage your bookings, clients, programs and account.</p>
      </header>

      <div className="customer-dashboard-layout">
        <nav className="customer-dashboard-nav" aria-label="Trainer dashboard navigation">
          {trainerNav.map(({ label, Icon, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                href={href}
                className={isActive ? "active" : undefined}
                key={label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="customer-dashboard-content">{children}</div>
      </div>
    </section>
  );
}
