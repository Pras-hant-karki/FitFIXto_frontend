"use client";

import { useEffect, useState } from "react";
import { BackendService, fetchPublicServices } from "@/features/services";
import { resolveAssetUrl } from "@/constants/api";

function serviceImage(service: BackendService) {
  if (!service.image) return "/ctabanner.png";
  if (service.image.startsWith("http") || service.image.startsWith("/")) return service.image;
  return resolveAssetUrl(service.image);
}

export function ProfessionalServices() {
  const [services, setServices] = useState<BackendService[]>([]);

  useEffect(() => {
    fetchPublicServices()
      .then(setServices)
      .catch(() => {});
  }, []);

  if (services.length === 0) return null;

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
            <article className="service-card" key={service._id}>
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
                <a href="/services">
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
