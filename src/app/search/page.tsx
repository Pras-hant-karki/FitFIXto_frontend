"use client";

import Link from "next/link";
import type { ReactNode } from "react";
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
  rank?: number;
  typeRank?: number;
};

type SearchSuggestion = {
  id: string;
  label: string;
  type: Exclude<SearchType, "all">;
  hint: string;
  href: string;
  rank: number;
  typeRank: number;
};

const serviceResults: SearchResult[] = [
  {
    id: "full-gym-setup",
    type: "service",
    title: "Full Gym Setup",
    subtitle: "Service - Design, delivery and installation",
    detail: "Custom layout design, equipment sourcing, professional installation",
    price: "From Npr 4,999",
    image: "/ctabanner.png",
    href: "/services",
  },
  {
    id: "sauna-steam-room",
    type: "service",
    title: "Sauna & Steam Room",
    subtitle: "Service - Sauna and steam installation",
    detail: "Cedar or hemlock options, controls, ventilation and warranty",
    price: "From Npr 7,499",
    image: "/ctabanner.png",
    href: "/services",
  },
  {
    id: "equipment-maintenance",
    type: "service",
    title: "Equipment Maintenance",
    subtitle: "Service - Preventative maintenance",
    detail: "Inspections, lubrication, cable checks and same-week response",
    price: "From Npr 199/mo",
    image: "/ctabanner.png",
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

const wordStartsWith = (value: string, query: string) =>
  value
    .toLowerCase()
    .split(/[\s\-_/.,]+/)
    .some((word) => word.startsWith(query.toLowerCase()));

const getFieldRank = (value: string | undefined, query: string, baseRank: number) => {
  if (!value) return Number.POSITIVE_INFINITY;

  const normalizedValue = value.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (normalizedValue.startsWith(normalizedQuery)) return baseRank;
  if (wordStartsWith(value, query)) return baseRank + 1;
  if (normalizedValue.includes(normalizedQuery)) return baseRank + 2;

  return Number.POSITIVE_INFINITY;
};

const getSearchRank = (result: SearchResult, query: string) =>
  Math.min(
    getFieldRank(result.title, query, 0),
    getFieldRank(result.subtitle, query, 3),
    getFieldRank(result.detail, query, 6),
    getFieldRank(result.price, query, 9),
  );

const getTypeRank = (result: SearchResult) => {
  if (result.type === "trainer") return 0;
  if (result.type === "product") return 1;
  return 2;
};

const withRanking = (result: SearchResult, query: string): SearchResult => ({
  ...result,
  rank: getSearchRank(result, query),
  typeRank: getTypeRank(result),
});

const sortResults = (resultsToSort: SearchResult[]) =>
  [...resultsToSort].sort((first, second) => {
    const rankDifference = (first.rank ?? 99) - (second.rank ?? 99);
    if (rankDifference !== 0) return rankDifference;

    const typeDifference = (first.typeRank ?? 99) - (second.typeRank ?? 99);
    if (typeDifference !== 0) return typeDifference;

    return first.title.localeCompare(second.title);
  });

const getSuggestionTerms = (result: SearchResult) => [
  { value: result.title, baseRank: 0, hint: result.type === "trainer" ? "Trainer name" : "Name" },
  { value: result.subtitle, baseRank: 3, hint: result.type === "trainer" ? "Location or experience" : "Category or brand" },
  { value: result.detail, baseRank: 6, hint: result.type === "trainer" ? "Specialty or certification" : "Details" },
  { value: result.price, baseRank: 9, hint: "Price" },
];

const buildSuggestions = (items: SearchResult[], query: string) => {
  if (!query.trim()) return [];

  const suggestions = new Map<string, SearchSuggestion>();

  items.forEach((item) => {
    getSuggestionTerms(item).forEach((term) => {
      if (!term.value) return;

      const rank = getFieldRank(term.value, query, term.baseRank);
      if (!Number.isFinite(rank)) return;

      const key = `${item.type}-${term.value.toLowerCase()}`;
      const suggestion: SearchSuggestion = {
        id: `${item.type}-${item.id}-${term.baseRank}`,
        label: term.value,
        type: item.type,
        hint: term.hint,
        href: item.href,
        rank,
        typeRank: getTypeRank(item),
      };

      const existing = suggestions.get(key);
      if (!existing || suggestion.rank < existing.rank) {
        suggestions.set(key, suggestion);
      }
    });
  });

  return [...suggestions.values()]
    .sort((first, second) => {
      const rankDifference = first.rank - second.rank;
      if (rankDifference !== 0) return rankDifference;

      const typeDifference = first.typeRank - second.typeRank;
      if (typeDifference !== 0) return typeDifference;

      return first.label.localeCompare(second.label);
    })
    .slice(0, 7);
};

const highlightMatch = (value: string, query: string): ReactNode => {
  if (!query) return value;

  const normalizedValue = value.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = normalizedValue.indexOf(normalizedQuery);

  while (matchIndex >= 0) {
    if (matchIndex > cursor) {
      parts.push(value.slice(cursor, matchIndex));
    }

    const endIndex = matchIndex + query.length;
    parts.push(
      <mark className="search-highlight" key={`${matchIndex}-${endIndex}`}>
        {value.slice(matchIndex, endIndex)}
      </mark>,
    );

    cursor = endIndex;
    matchIndex = normalizedValue.indexOf(normalizedQuery, cursor);
  }

  if (cursor < value.length) {
    parts.push(value.slice(cursor));
  }

  return parts;
};

const toProductResult = (product: BackendProduct): SearchResult => ({
  id: product._id,
  type: "product",
  title: product.name,
  subtitle: [product.brand || "FitFIXto", formatCategory(product.category), product.subcategory].filter(Boolean).join(" - "),
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
  const [suggestionItems, setSuggestionItems] = useState<SearchResult[]>(serviceResults);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
    setQuery(initialQuery);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const loadSuggestionItems = async () => {
      try {
        const [productResponse, trainers] = await Promise.all([
          fetchProducts({ limit: 50 }),
          fetchPublicTrainers(),
        ]);

        if (!isCurrent) return;

        setSuggestionItems([
          ...(productResponse?.products || []).map(toProductResult),
          ...trainers.map(toTrainerResult),
          ...serviceResults,
        ]);
      } catch {
        if (isCurrent) {
          setSuggestionItems(serviceResults);
        }
      }
    };

    loadSuggestionItems();

    return () => {
      isCurrent = false;
    };
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
          .map(toTrainerResult)
          .map((result) => withRanking(result, debouncedQuery))
          .filter((result) => Number.isFinite(result.rank));

        const matchingServices = serviceResults
          .filter((service) => includesQuery([service.title, service.subtitle, service.detail, service.price], debouncedQuery))
          .map((result) => withRanking(result, debouncedQuery))
          .filter((result) => Number.isFinite(result.rank));

        if (isCurrent) {
          const productResults = (productResponse?.products || [])
            .map(toProductResult)
            .map((result) => withRanking(result, debouncedQuery))
            .filter((result) => Number.isFinite(result.rank));

          setResults(sortResults([
            ...productResults,
            ...trainerResults,
            ...matchingServices,
          ]));
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
  const suggestions = useMemo(
    () => buildSuggestions(suggestionItems, query.trim()),
    [suggestionItems, query],
  );

  const applySuggestion = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.label);
    setActiveFilter("all");
  };

  return (
    <section className="search-page">
      <header className="search-header">
        <h1>Search Your Need</h1>
        <p>Find equipment, supplements, trainers and services - all in one place.</p>
      </header>

      <div className="global-search-shell">
        <label className="global-search-field">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try 'dumbbell', 'whey', 'Aria', 'sauna'..."
            autoComplete="off"
            autoFocus
          />
        </label>

        {query.trim() && suggestions.length ? (
          <div className="search-suggestion-list" role="listbox" aria-label="Search suggestions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                role="option"
                onClick={() => applySuggestion(suggestion)}
              >
                <span>{highlightMatch(suggestion.label, query.trim())}</span>
                <small>
                  {suggestion.type} - {suggestion.hint}
                </small>
              </button>
            ))}
          </div>
        ) : null}
      </div>

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
                    <strong>{highlightMatch(result.title, debouncedQuery)}</strong>
                    <p>{highlightMatch(result.subtitle, debouncedQuery)}</p>
                    {result.type === "trainer" && result.detail ? (
                      <small>
                        <MapPin aria-hidden="true" />
                        {highlightMatch(result.detail, debouncedQuery)}
                      </small>
                    ) : result.detail ? (
                      <small>{highlightMatch(result.detail, debouncedQuery)}</small>
                    ) : null}
                  </div>
                  {result.price ? <b>{highlightMatch(result.price, debouncedQuery)}</b> : null}
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
