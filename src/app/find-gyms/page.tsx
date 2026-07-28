"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, MapPin, Navigation, Phone, Search, Star } from "lucide-react";
import {
  fetchPublicPartnerGyms,
  normalizeGymImageUrl,
  type BackendPartnerGym,
} from "@/features/partner-gyms";
import {
  googleMapsApiKey,
  loadGoogleMaps,
  MAPS_AUTH_FAILURE_MESSAGE,
  nepalCenter,
  type GoogleMapInstance,
  type GoogleMarkerInstance,
} from "@/lib/google-maps";
import { useMapsAuthFailure } from "@/hooks";

const fallbackImages = ["/home-hero-gym.png", "/ctabanner.png"];

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
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapsAuthFailed = useMapsAuthFailure();
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markersRef = useRef<GoogleMarkerInstance[]>([]);
  const markerFactoryRef = useRef<typeof google.maps.Marker | null>(null);
  const boundsFactoryRef = useRef<typeof google.maps.LatLngBounds | null>(null);

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

  useEffect(() => {
    if (!googleMapsApiKey || !mapElementRef.current) return;
    let isMounted = true;

    loadGoogleMaps(googleMapsApiKey)
      .then(({ maps, core, marker }) => {
        if (!isMounted || !mapElementRef.current) return;

        // Constructors come from the resolved libraries; window.google is not populated
        // until the async bootstrap finishes.
        const map = new maps.Map(mapElementRef.current, {
          center: nepalCenter,
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
        });

        mapRef.current = map;
        markerFactoryRef.current = marker.Marker;
        boundsFactoryRef.current = core.LatLngBounds;
        setMapLoaded(true);
      })
      .catch(() => {
        // placeholder stays visible on error
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const MarkerCtor = markerFactoryRef.current;
    const BoundsCtor = boundsFactoryRef.current;
    if (!mapRef.current || !MarkerCtor || !BoundsCtor) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new BoundsCtor();
    let hasMarkers = false;

    gyms.forEach((gym) => {
      const pin = parsePin(gym.pin);
      if (!pin) return;

      const marker = new MarkerCtor({
        map: mapRef.current!,
        position: pin,
        title: gym.name,
      });

      markersRef.current.push(marker);
      bounds.extend(pin);
      hasMarkers = true;
    });

    if (hasMarkers) {
      mapRef.current.fitBounds(bounds);
    }
    // mapLoaded gates this on the constructors being captured, so markers are drawn for
    // gyms that arrived before the map finished loading.
  }, [gyms, mapLoaded]);

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
        <section className="public-gyms-map" aria-label="Partner gym locations map">
          {mapsAuthFailed ? (
            <p className="public-gyms-map-warning" role="status">
              <MapPin aria-hidden="true" />
              {MAPS_AUTH_FAILURE_MESSAGE}
            </p>
          ) : null}
          <div ref={mapElementRef} className="public-gyms-map-inner" />
          {!mapLoaded ? (
            <div className="public-gyms-map-center">
              <MapPin aria-hidden="true" />
              <strong>Interactive map</strong>
              <span>
                {googleMapsApiKey
                  ? "Loading map…"
                  : "Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map"}
              </span>
            </div>
          ) : null}
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
