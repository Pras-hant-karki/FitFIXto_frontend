import Link from "next/link";
import type { ReactNode } from "react";

interface RouteShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
}

export function RouteShell({
  eyebrow,
  title,
  description,
  children,
  actionHref,
  actionLabel,
}: RouteShellProps) {
  return (
    <section className="route-page">
      <div className="route-page-inner">
        <div className="route-heading">
          <p>{eyebrow}</p>
          <h1>{title}</h1>
          <span>{description}</span>
        </div>
        {children ? <div className="route-card">{children}</div> : null}
        {actionHref && actionLabel ? (
          <Link className="button button-primary" href={actionHref}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
