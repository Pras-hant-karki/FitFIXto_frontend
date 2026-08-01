"use client";

import { usePathname } from "next/navigation";
import { getPortalForPath, isAuthRoute } from "@/utils";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

/**
 * Chooses the navigation chrome for the current route.
 *
 * This replaces the previous approach of always mounting the navbar and hiding it with
 * injected `display:none` CSS from individual pages — which meant every admin screen still
 * built the storefront navbar, and briefly showed it.
 *
 * - `/admin/*` → no global chrome; AdminShell supplies the console's own topbar and sidebar.
 * - auth pages → no chrome at all.
 * - everything else, including `/trainer/*` → the storefront navbar and footer. Trainers shop,
 *   book services and find gyms like any customer, so they get the same header; the
 *   trainer-specific navigation lives in the dashboard sidebar.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const portal = getPortalForPath(pathname);
  const showsNoChrome = isAuthRoute(pathname) || portal === "admin";

  if (showsNoChrome) {
    return <main className="site-main site-main-bare">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="site-main">{children}</main>
      <Footer />
    </>
  );
}
