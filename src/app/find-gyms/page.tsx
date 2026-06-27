"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Navigation, Phone, Search, Star } from "lucide-react";
import {
  fetchPublicPartnerGyms,
  normalizeGymImageUrl,
  type BackendPartnerGym,
} from "@/features/partner-gyms";

const fallbackImages = ["/home-hero-gym.png", "/assets/ctabanner.png"];

const parsePin = (pin?: string) => {
  if (!pin) return null;

  const [lat, lng] = pin.split(",").map((value) => Number(value.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
};

const getDirectionsHref = (gym: BackendPartnerGym) => {
  if (gym.locationUrl) return gym.locationUrl;

  const pin = parsePin(gym.pin);
  if (pin) {
    return `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.name + " " + gym.address)}`;
};

export default function FindGymsPage() {
  const [gyms, setGyms] = useState<BackendPartnerGym[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    fetchPublicPartnerGyms()
      .then((nextGyms) => {
        if (isCurrent) {
          setGyms(nextGyms);
          setError("");
        }
      })
      .catch((loadError) => {
        if (isCurrent) {
          setGyms([]);
          setError(loadError instanceof Error ? loadError.message : "Unable to load partner gyms.");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const visibleGyms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return gyms;

    return gyms.filter((gym) =>
      [gym.name, gym.address, gym.phone, gym.hours]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [gyms, query]);

  return (
    <section className="public-gyms-page">
      <header className="public-gyms-header">
        <div>
          <h1>Find a FitFIXto gym</h1>
          <p>Our partner gyms near you.</p>
        </div>
        <label className="public-gyms-search">
          <Search aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, address or area..."
            type="search"
          />
        </label>
      </header>

      <div className="public-gyms-layout">
        <section className="public-gyms-map" aria-label="Partner gym map preview">
          <div className="public-map-marker one">
            <MapPin aria-hidden="true" />
          </div>
          <div className="public-map-marker two">
            <MapPin aria-hidden="true" />
          </div>
          <div className="public-map-marker three">
            <MapPin aria-hidden="true" />
          </div>
          <div className="public-gyms-map-center">
            <MapPin aria-hidden="true" />
            <strong>Interactive map</strong>
            <span>{visibleGyms.length} locations near you</span>
          </div>
        </section>

        <section className="public-gym-list" aria-label="Partner gyms">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <article className="public-gym-card loading" key={index}>
                <span />
                <div>
                  <i />
                  <b />
                  <em />
                </div>
              </article>
            ))
          ) : error ? (
            <div className="public-gym-empty">
              <strong>Could not load gyms</strong>
              <span>{error}</span>
            </div>
          ) : visibleGyms.length ? (
            visibleGyms.map((gym, index) => {
              const image = normalizeGymImageUrl(gym.images?.[0]) || fallbackImages[index % fallbackImages.length];

              return (
                <article className="public-gym-card" key={gym._id}>
                  <div className="public-gym-image">
                    {image ? <img src={image} alt={gym.name} /> : <MapPin aria-hidden="true" />}
                  </div>
                  <div className="public-gym-info">
                    <h2>{gym.name}</h2>
                    {typeof gym.rating === "number" ? (
                      <p className="public-gym-rating">
                        <Star aria-hidden="true" />
                        {gym.rating.toFixed(1)}
                      </p>
                    ) : null}
                    <p>
                      <MapPin aria-hidden="true" />
                      {gym.address}
                    </p>
                    {gym.phone ? (
                      <p>
                        <Phone aria-hidden="true" />
                        {gym.phone}
                      </p>
                    ) : null}
                    {gym.hours ? (
                      <p>
                        <Clock aria-hidden="true" />
                        {gym.hours}
                      </p>
                    ) : null}
                    <a href={getDirectionsHref(gym)} target="_blank" rel="noreferrer">
                      <Navigation aria-hidden="true" />
                      Get Directions
                    </a>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="public-gym-empty">
              <strong>No gyms found</strong>
              <span>{query ? "Try another search." : "Admin has not published any partner gyms yet."}</span>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
