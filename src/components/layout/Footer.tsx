import Image from "next/image";
import Link from "next/link";

const footerGroups = [
  {
    title: "Shop",
    links: [
      { label: "Equipment", href: "/shop" },
      { label: "Supplements", href: "/shop?category=supplements" },
      { label: "Bundles", href: "/#bundles" },
      { label: "New Arrivals", href: "/#shop" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Gym Setup", href: "/services" },
      { label: "Trainer Booking", href: "/trainers" },
      { label: "Maintenance", href: "/services" },
      { label: "Consultation", href: "/trainers" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Shipping Info", href: "/shop" },
      { label: "Warranty", href: "/shop" },
      { label: "Returns", href: "/user/orders" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Image src="/logo.png" alt="FitFIXto" width={150} height={49} className="footer-logo footer-logo-dark" />
          <Image src="/fitfixto_logo.png" alt="FitFIXto" width={150} height={49} className="footer-logo footer-logo-light" />
          <p>Premium equipment, trainers, and gym services built around serious results.</p>
        </div>

        {footerGroups.map((group) => (
          <div className="footer-links" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map((link) => (
              <Link href={link.href} key={link.label}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© 2026 FitFIXto. All rights reserved.</span>
        <span>Built for athletes, by athletes.</span>
      </div>
    </footer>
  );
}
