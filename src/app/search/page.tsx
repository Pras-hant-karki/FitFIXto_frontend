"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MapPin, Search } from "lucide-react";
import {
  fetchProducts,
  formatCategory,
  getProductImage,
  type BackendProduct,
} from "@/features/products";
import {
  fetchPublicTrainers,
  normalizeTrainerPhotoUrl,
  type BackendTrainer,
} from "@/features/trainers";

type SearchType = "all" | "product" | "trainer" | "service";

type SearchResult = {
  id: string;
  type: Exclude<SearchType, "all">;
  title: string;
  subtitle: string;
  detail?: string;
  price?: string;
  image?: string;
  href: string;
  verified?: boolean;
};

const serviceResults: SearchResult[] = [
  {
    id: "full-gym-setup",
    type: "service",
    title: "Full Gym Setup",
    subtitle: "Service - Design, delivery and installation",
    detail: "Custom layout design, equipment sourcing, professional installation",
    price: "From Npr 4,999",
    image: "/assets/ctabanner.png",
    href: "/services",
  },
  {
    id: "sauna-steam-room",
    type: "service",
    title: "Sauna & Steam Room",
    subtitle: "Service - Sauna and steam installation",
    detail: "Cedar or hemlock options, controls, ventilation and warranty",
    price: "From Npr 7,499",
    image: "/assets/ctabanner.png",
    href: "/services",
  },
  {
    id: "equipment-maintenance",
    type: "service",
    title: "Equipment Maintenance",
    subtitle: "Service - Preventative maintenance",
    detail: "Inspections, lubrication, cable checks and same-week response",
    price: "From Npr 199/mo",
    image: "/assets/ctabanner.png",
    href: "/services",
  },
];

const filters: Array<{ label: string; value: SearchType }> = [
  { label: "All", value: "all" },
  { label: "Products", value: "product" },
  { label: "Trainers", value: "trainer" },
  { label: "Services", value: "service" },
];

const formatNpr = (value: number) => `Npr ${value.toLocaleString("en-US")}`;

const getTrainerName = (trainer: BackendTrainer) =>
  `${trainer.userId.firstName} ${trainer.userId.lastName}`.trim();

const includesQuery = (parts: Array<string | number | undefined | null>, query: string) =>
  parts.join(" ").toLowerCase().includes(query.toLowerCase());

const toProductResult = (product: BackendProduct): SearchResult => ({
  id: product._id,
  type: "product",
  title: product.name,
  subtitle: `${product.brand || "FitFIXto"} - ${formatCategory(product.category)}`,
  detail: product.description,
  price: formatNpr(product.price),
  image: getProductImage(product),
  href: `/products/${product._id}`,
  verified: product.verifiedBadge,
});

const toTrainerResult = (trainer: BackendTrainer): SearchResult => {
  const specialties = trainer.specialties.slice(0, 3).join(", ");

  return {
    id: trainer._id,
    type: "trainer",
    title: getTrainerName(trainer),
    subtitle: `${trainer.location || "Nepal"} - ${trainer.experienceYears}+ yrs`,
    detail: specialties || trainer.certifications.slice(0, 2).join(", "),
    price: `${formatNpr(trainer.sessionRate)}/session`,
    image: normalizeTrainerPhotoUrl(trainer.userId.profilePicture),
    href: `/trainers/${trainer._id}`,
  };
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SearchType>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
    setQuery(initialQuery);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 260);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    } else {
      params.delete("q");
    }

    const nextUrl = params.toString() ? `/search?${params.toString()}` : "/search";
    window.history.replaceState(null, "", nextUrl);
  }, [debouncedQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setError("");
      setIsLoading(false);
      return;
    }

    let isCurrent = true;

    const loadResults = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [productResponse, trainers] = await Promise.all([
          fetchProducts({ search: debouncedQuery, limit: 8 }),
          fetchPublicTrainers(),
        ]);

        const trainerResults = trainers
          .filter((trainer) =>
            includesQuery(
              [
                getTrainerName(trainer),
                trainer.userId.email,
                trainer.location,
                trainer.sessionRate,
                trainer.experienceYears,
                ...trainer.specialties,
                ...trainer.certifications,
              ],
              debouncedQuery,
            ),
          )
          .map(toTrainerResult);

        const matchingServices = serviceResults.filter((service) =>
          includesQuery([service.title, service.subtitle, service.detail, service.price], debouncedQuery),
        );

        if (isCurrent) {
          const productResults = (productResponse?.products || []).map(toProductResult);

          setResults([
            ...productResults,
            ...trainerResults,
            ...matchingServices,
          ]);
        }
      } catch (searchError) {
        if (isCurrent) {
          setResults([]);
          setError(searchError instanceof Error ? searchError.message : "Unable to search right now.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    loadResults();

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery]);

  const counts = useMemo(
    () => ({
      all: results.length,
      product: results.filter((result) => result.type === "product").length,
      trainer: results.filter((result) => result.type === "trainer").length,
      service: results.filter((result) => result.type === "service").length,
    }),
    [results],
  );

  const visibleResults = activeFilter === "all" ? results : results.filter((result) => result.type === activeFilter);

  return (
    <section className="search-page">
      <header className="search-header">
        <h1>Search Your Need</h1>
        <p>Find equipment, supplements, trainers and services - all in one place.</p>
      </header>

      <label className="global-search-field">
        <Search aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try 'dumbbell', 'whey', 'Aria', 'sauna'..."
          autoFocus
        />
      </label>

      {!debouncedQuery ? (
        <div className="search-empty-card">
          <Search aria-hidden="true" />
          <strong>Start typing to search</strong>
          <span>We&apos;ll look across products, trainers and services.</span>
        </div>
      ) : (
        <div className="search-results-area">
          <div className="search-filter-tabs" role="tablist" aria-label="Search result filters">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={activeFilter === filter.value ? "active" : ""}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label} ({counts[filter.value]})
              </button>
            ))}
          </div>

          <p className="search-match-count">
            <strong>{visibleResults.length}</strong> items matched with search
          </p>

          {isLoading ? (
            <div className="search-result-list" aria-label="Loading search results">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="search-result-card loading" key={index}>
                  <span />
                  <div>
                    <i />
                    <b />
                    <em />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="search-empty-card compact">
              <strong>Search failed</strong>
              <span>{error}</span>
            </div>
          ) : visibleResults.length ? (
            <div className="search-result-list">
              {visibleResults.map((result) => (
                <Link className="search-result-card" href={result.href} key={`${result.type}-${result.id}`}>
                  <div className="search-result-image">
                    {result.image ? <img src={result.image} alt={result.title} /> : <span>No image</span>}
                  </div>
                  <div className="search-result-copy">
                    <div className="search-result-meta">
                      <span>{result.type}</span>
                      {result.verified ? <CheckCircle2 aria-label="Verified product" /> : null}
                    </div>
                    <strong>{result.title}</strong>
                    <p>{result.subtitle}</p>
                    {result.type === "trainer" && result.detail ? (
                      <small>
                        <MapPin aria-hidden="true" />
                        {result.detail}
                      </small>
                    ) : result.detail ? (
                      <small>{result.detail}</small>
                    ) : null}
                  </div>
                  {result.price ? <b>{result.price}</b> : null}
                </Link>
              ))}
            </div>
          ) : (
            <div className="search-empty-card compact">
              <strong>No matches found</strong>
              <span>Try another product name, trainer name, category or service.</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
