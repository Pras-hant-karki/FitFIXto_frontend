const services = [
  {
    title: "Full Gym Setup",
    price: "From $4,999",
    image: "/service-gym-setup.png",
    copy: "End-to-end commercial and home gym design, equipment delivery and installation.",
    features: ["Custom layout design", "Equipment sourcing", "Professional installation", "30-day support"],
  },
  {
    title: "Sauna & Steam Room",
    price: "From $7,499",
    image: "/service-sauna.png",
    copy: "Premium sauna and steam room installation with electrical and ventilation.",
    features: ["Cedar / hemlock options", "Digital control panel", "Ventilation system", "2-year warranty"],
  },
  {
    title: "Equipment Maintenance",
    price: "From $199/mo",
    image: "/service-maintenance.png",
    copy: "Scheduled preventative maintenance for your commercial fitness equipment.",
    features: ["Quarterly inspections", "Lubrication & belts", "Cable & pulley check", "Same-week response"],
  },
];

export function ProfessionalServices() {
  return (
    <section className="home-section" id="services">
      <div className="section-inner">
        <div className="section-heading">
          <p>We Build It</p>
          <h2>Professional Services</h2>
          <span>From design to install to maintenance - turnkey for any space.</span>
        </div>

        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service.title}>
              <img src={service.image} alt={service.title} />
              <div className="service-body">
                <div className="service-title-row">
                  <h3>{service.title}</h3>
                  <strong>{service.price}</strong>
                </div>
                <p>{service.copy}</p>
                <ul>
                  {service.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <a href="#">
                  Learn More <span aria-hidden="true">-&gt;</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
