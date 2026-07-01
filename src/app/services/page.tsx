"use client";

import { useEffect, useState } from "react";
import { BackendService, fetchPublicServices } from "@/features/services";

function serviceImage(service: BackendService) {
  if (!service.image) return "/assets/ctabanner.png";
  if (service.image.startsWith("http") || service.image.startsWith("/")) return service.image;
  return `/assets/${service.image}`;
}

function ServiceCard({ service }: { service: BackendService }) {
  return (
    <div className="service-card">
      <img src={serviceImage(service)} alt={service.name} />
      <div className="service-body">
        <div className="service-title-row">
          <h3>{service.name}</h3>
          {service.priceLabel && <strong>{service.priceLabel}</strong>}
        </div>
        <p>{service.description}</p>
        {service.features.length > 0 && (
          <ul>
            {service.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<BackendService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicServices()
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="services-hero-inner">
          <h1>Build the gym you&apos;ve always wanted.</h1>
          <p>Design, install, and maintain — at home, in your office, or for a commercial facility.</p>
        </div>
      </section>

      <section className="services-main">
        <div className="section-inner">
          <div className="section-heading">
            <p>Services</p>
            <h2>What we build</h2>
          </div>

          {loading ? (
            <div className="services-loading">Loading services…</div>
          ) : services.length === 0 ? (
            <div className="services-empty">No services available at the moment.</div>
          ) : (
            <div className="service-grid">
              {services.map((service) => (
                <ServiceCard key={service._id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
