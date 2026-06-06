const benefits = [
  {
    label: "Lifetime Warranty",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    ),
  },
  {
    label: "Free Shipping",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h12v11H3z" />
        <path d="M15 10h4l2 3v4h-6z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    ),
  },
  {
    label: "Certified Equipment",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
        <path d="m9 14-1 8 4-2 4 2-1-8" />
      </svg>
    ),
  },
  {
    label: "Expert Support",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <path d="M4 14h4v6H4zM16 14h4v6h-4z" />
      </svg>
    ),
  },
];

export function TrustBenefits() {
  return (
    <section className="trust-benefits" aria-label="FitFIXto customer benefits">
      <div className="trust-benefits-inner">
        {benefits.map((benefit) => (
          <div className="benefit-item" key={benefit.label}>
            <span className="benefit-icon">{benefit.icon}</span>
            <span>{benefit.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
