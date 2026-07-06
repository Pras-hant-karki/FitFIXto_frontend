"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { HomepagePromotionalBanner, fetchHomepageSettings } from "@/features/homepage/api";

export function PromotionalBanner() {
  const [banner, setBanner] = useState<HomepagePromotionalBanner | null>(null);

  useEffect(() => {
    fetchHomepageSettings()
      .then((settings) => {
        if (settings?.promotionalBanner?.isVisible && settings.promotionalBanner.text) {
          setBanner(settings.promotionalBanner);
        }
      })
      .catch(() => {});
  }, []);

  if (!banner) return null;

  return (
    <section className="promo-banner-section">
      <div className="promo-banner-inner">
        <div className="promo-banner-content">
          <p className="promo-banner-eyebrow">
            <Megaphone aria-hidden="true" />
            Limited Offer
          </p>
          <p className="promo-banner-text" style={{ fontSize: banner.fontSize || 24 }}>
            {banner.text}
          </p>
        </div>
        {banner.link ? (
          <Link href={banner.link} className="promo-banner-cta">
            Shop Now <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
