"use client";

import { useEffect, useState } from "react";
import { HomepageHero, fetchHomepageSettings } from "@/features/homepage/api";

const defaultHero: HomepageHero = {
  eyebrow: "",
  title: "Built for Strength",
  subtitle: "Premium equipment, expert installation, and professional trainers for serious results.",
  ctaLabel: "Shop Equipment",
  ctaLink: "#shop",
  imageUrl: "/home-hero-gym.png",
  eyebrowFontSize: 14,
  titleFontSize: 72,
  subtitleFontSize: 24,
  ctaFontSize: 18,
};

export function HeroSection() {
  const [hero, setHero] = useState<HomepageHero>(defaultHero);

  useEffect(() => {
    const loadHero = async () => {
      try {
        const settings = await fetchHomepageSettings();
        if (settings?.hero) {
          setHero({ ...defaultHero, ...settings.hero });
        }
      } catch {
        setHero(defaultHero);
      }
    };

    loadHero();
  }, []);

  const heading = hero.title || hero.eyebrow || defaultHero.title;

  return (
    <section
      className="hero-section"
      id="home"
      aria-label="FitFIXto hero"
      style={{ backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.62) 40%, rgba(0, 0, 0, 0.14) 78%), url("${encodeURI(hero.imageUrl || defaultHero.imageUrl).replace(/"/g, '%22')}")` }}
    >
      <div className="hero-content">
        {hero.eyebrow && hero.title ? (
          <span className="hero-eyebrow" style={{ fontSize: hero.eyebrowFontSize }}>
            {hero.eyebrow}
          </span>
        ) : null}
        <h1 style={{ fontSize: `clamp(44px, 6.1vw, ${hero.titleFontSize}px)` }}>{heading}</h1>
        <p style={{ fontSize: hero.subtitleFontSize }}>{hero.subtitle}</p>
        <div className="hero-actions">
          <a className="button button-primary" href={hero.ctaLink || "#shop"} style={{ fontSize: hero.ctaFontSize }}>
            {hero.ctaLabel || "Shop Equipment"}
            <span aria-hidden="true">-&gt;</span>
          </a>
          <a className="button button-glass" href="#trainers">
            Hire a Trainer
          </a>
        </div>
      </div>
    </section>
  );
}
