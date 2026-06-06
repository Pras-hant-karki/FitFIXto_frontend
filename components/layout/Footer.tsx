import Image from "next/image";

const footerGroups = [
  { title: "Shop", links: ["Equipment", "Supplements", "Bundles", "New Arrivals"] },
  { title: "Services", links: ["Gym Setup", "Trainer Booking", "Maintenance", "Consultation"] },
  { title: "Support", links: ["Contact", "Shipping", "Warranty", "Returns"] },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Image src="/fitfixto_logo.png" alt="FitFIXto" width={150} height={49} className="footer-logo" />
          <p>Premium equipment, trainers, and gym services built around serious results.</p>
        </div>

        {footerGroups.map((group) => (
          <div className="footer-links" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map((link) => (
              <a href="#" key={link}>
                {link}
              </a>
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
