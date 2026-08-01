"use client";

import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/shared";

/**
 * The /user area is the customer account portal.
 *
 * Order detail is the one exception: trainers buy equipment too, and their dashboard links to
 * the same `/user/orders/:id` page, so that subtree accepts both roles. The backend still
 * scopes every order to the signed-in buyer, so a trainer can only ever open their own.
 */
const SHARED_WITH_TRAINERS = ["/user/orders/"];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSharedRoute = SHARED_WITH_TRAINERS.some((prefix) => pathname.startsWith(prefix));
  const allowedRoles = isSharedRoute ? ["customer", "trainer"] : ["customer"];

  return <ProtectedRoute allowedRoles={allowedRoles}>{children}</ProtectedRoute>;
}
