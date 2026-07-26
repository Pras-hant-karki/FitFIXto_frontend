"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  LayoutGrid,
  LogOut,
  MapPin,
  MessageSquareText,
  Moon,
  Package,
  RotateCcw,
  Settings,
  Shield,
  ShoppingBag,
  Tag,
  User,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutGrid },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Services", href: "/admin/services", icon: Wrench },
  { label: "Discounts", href: "/admin/discounts", icon: Tag },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Returns", href: "/admin/returns", icon: RotateCcw },
  { label: "Trainers", href: "/admin/trainers", icon: UserCog },
  { label: "Profile", href: "/admin/profile", icon: User },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquareText },
  { label: "Homepage", href: "/admin/homepage", icon: Home },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Partner Gyms", href: "/admin/partner-gyms", icon: MapPin },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const footerGroups = [
  { title: "About", links: ["Our Story", "Careers", "Press", "Sustainability"] },
  { title: "Shop", links: ["All Equipment", "Supplements", "Compare", "Wishlist"] },
  { title: "Services", links: ["Gym Setup", "Sauna & Steam", "Maintenance", "Hire Trainers"] },
  { title: "Support", links: ["Help Center", "Order Tracking", "Returns", "Contact Us"] },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const displayName = user?.firstName || user?.lastName ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() : "admin";
  const displayEmail = user?.email ?? "admin@fitfixto.com";

  const handleThemeToggle = () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
  };

  const handleLogout = () => {
    logout();
    // ProtectedRoute handles redirect to /admin/login when isAuthenticated becomes false
  };

  return (
    <>
      <style>{`.site-navbar,.site-footer{display:none}.site-main{padding-top:0}`}</style>
      <div className="admin-shell">
        <header className="admin-topbar">
          <Link href="/admin/dashboard" className="admin-brand" aria-label="FitFIXto admin dashboard">
            <Image src="/logo.png" alt="FitFIXto" width={206} height={72} priority style={{ width: "auto", height: "44px" }} />
          </Link>
          <span className="admin-badge">
            <Shield aria-hidden="true" />
            ADMIN
          </span>
          <div className="admin-topbar-actions">
            <button type="button" className="admin-icon-button" aria-label="Toggle dark mode" onClick={handleThemeToggle}>
              <Moon aria-hidden="true" />
            </button>
            <button type="button" className="admin-icon-button" aria-label="Admin profile">
              <User aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="admin-body">
          <aside className="admin-sidebar" aria-label="Admin navigation">
            <div className="admin-console-card">
              <div className="admin-console-eyebrow">
                <Shield aria-hidden="true" />
                <span>ADMIN CONSOLE</span>
              </div>
              <strong>{displayName}</strong>
              <span>{displayEmail}</span>
            </div>

            <nav className="admin-sidebar-nav">
              {navItems.map(({ label, href, icon: Icon }) => {
                const isActive = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));

                return (
                  <Link href={href} className={isActive ? "active" : undefined} key={href}>
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <button type="button" className="admin-logout" onClick={handleLogout}>
              <LogOut aria-hidden="true" />
              <span>Logout</span>
            </button>
          </aside>

          <div className="admin-main">
            <main className="admin-content">{children}</main>
          </div>
        </div>

        <footer className="admin-footer">
            <div className="admin-footer-inner">
              <div className="admin-footer-brand">
                <Image src="/logo.png" alt="FitFIXto" width={206} height={72} style={{ width: "auto", height: "44px" }} />
                <p>Premium gym equipment, supplements, services and trainers - all in one place.</p>
                <div className="admin-socials" aria-label="Social links">
                  <a href="#" aria-label="Facebook">
                    f
                  </a>
                  <a href="#" aria-label="Instagram">
                    ig
                  </a>
                  <a href="#" aria-label="Twitter">
                    x
                  </a>
                  <a href="#" aria-label="YouTube">
                    yt
                  </a>
                </div>
              </div>

              {footerGroups.map((group) => (
                <div className="admin-footer-links" key={group.title}>
                  <h2>{group.title}</h2>
                  {group.links.map((link) => (
                    <a href="#" key={link}>
                      {link}
                    </a>
                  ))}
                </div>
              ))}
            </div>
            <div className="admin-footer-bottom">
              <span>&copy; 2026 FitFIXto. All rights reserved.</span>
              <span>Built for athletes, by athletes.</span>
            </div>
        </footer>
      </div>
    </>
  );
}
