"use client";

import { ReactNode, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, CalendarDays, RotateCcw, Settings, Star, UserRound } from "lucide-react";
import { useAuth } from "@/contexts";

const customerNav = [
  { label: "Orders", Icon: Box, href: "/user/dashboard" },
  { label: "Bookings", Icon: CalendarDays, href: "/user/bookings" },
  { label: "To Review", Icon: Star, href: "/user/to-review" },
  { label: "Returns", Icon: RotateCcw, href: "/user/returns" },
  { label: "Profile", Icon: UserRound, href: "/user/profile" },
  { label: "Settings", Icon: Settings },
];

const getUserName = (email?: string) => {
  if (!email) return "customer";
  return email.split("@")[0] || "customer";
};

type CustomerDashboardShellProps = {
  children: ReactNode;
};

export function CustomerDashboardShell({ children }: CustomerDashboardShellProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const username = useMemo(() => getUserName(user?.email), [user?.email]);

  return (
    <section className="customer-dashboard-page">
      <header className="customer-dashboard-header">
        <h1>Welcome back, {username}.</h1>
        <p>Manage orders, bookings and your account.</p>
      </header>

      <div className="customer-dashboard-layout">
        <nav className="customer-dashboard-nav" aria-label="Customer dashboard navigation">
          {customerNav.map(({ label, Icon, href }) => {
            const isActive = href ? pathname === href : false;
            const content = (
              <>
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </>
            );

            return href ? (
              <Link href={href} className={isActive ? "active" : undefined} key={label} aria-current={isActive ? "page" : undefined}>
                {content}
              </Link>
            ) : (
              <button type="button" key={label} disabled>
                {content}
              </button>
            );
          })}
        </nav>

        <div className="customer-dashboard-content">{children}</div>
      </div>
    </section>
  );
}
