"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Heart, ShoppingCart, Star } from "lucide-react";
import {
  BackendProduct,
  fetchProducts,
  formatCategory,
  getOriginalPrice,
  getProductImage,
} from "@/features/products";

const DEFAULT_MAX_PRICE = 3000;

interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const parseListParam = (value: string | null) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({ min, max, value, onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  const getPercentage = useCallback((val: number) => ((val - min) / (max - min || 1)) * 100, [min, max]);

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(min + percentage * (max - min));
    },
    [min, max]
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragging) return;
      const newValue = getValueFromPosition(event.clientX);
      if (dragging === "min") {
        onChange([Math.min(newValue, value[1] - 50), value[1]]);
      } else {
        onChange([value[0], Math.max(newValue, value[0] + 50)]);
      }
    };

    const handleMouseUp = () => setDragging(null);

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, value, onChange, getValueFromPosition]);

  const minPercent = getPercentage(value[0]);
  const maxPercent = getPercentage(value[1]);

  return (
    <div className="relative w-full h-12 select-none">
      <div ref={trackRef} className="absolute top-1/2 left-0 right-0 h-2 -mt-1 rounded-full bg-gray-200" />
      <div
        className="absolute top-1/2 h-2 -mt-1 rounded-full"
        style={{
          left: `${minPercent}%`,
          right: `${100 - maxPercent}%`,
          background: "linear-gradient(to right, #000000, #dc2626)",
        }}
      />
      <div
        className="absolute top-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-full bg-white border-2 border-black shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10"
        style={{ left: `${minPercent}%` }}
        onMouseDown={() => setDragging("min")}
      />
      <div
        className="absolute top-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-full bg-white border-2 border-red-600 shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10"
        style={{ left: `${maxPercent}%` }}
        onMouseDown={() => setDragging("max")}
      />
      <div className="flex justify-between mt-4 text-sm text-gray-600">
        <span>Npr {value[0]}</span>
        <span>Npr {value[1]}</span>
      </div>
    </div>
  );
};

interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-3 cursor-pointer group">
    <button
      type="button"
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
        checked ? "bg-black border-black" : "border-gray-300 group-hover:border-gray-400"
      }`}
      onClick={onChange}
      aria-label={label}
    >
      {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
    </button>
    <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
  </label>
);

const ProductCard: React.FC<{ product: BackendProduct }> = ({ product }) => {
  const discount = product.discountPercentage || 0;
  const originalPrice = getOriginalPrice(product);

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="relative h-56 bg-gray-50">
        <Link href={`/products/${product._id}`} className="block h-full">
          {getProductImage(product) ? (
            <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="product-no-image">No image</div>
          )}
        </Link>
        {product.verifiedBadge && (
          <div className="absolute top-3 left-3 flex items-center space-x-1 bg-black text-white text-xs font-bold px-2 py-1 rounded">
            <CheckCircle2 className="w-3 h-3" />
            <span>VERIFIED</span>
          </div>
        )}
        {discount > 0 ? <div className="absolute top-3 left-24 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">-{discount}%</div> : null}
        <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100 transition-colors">
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">
          {formatCategory(product.category)} - {product.brand || "FitFIXto"}
        </div>
        <Link href={`/products/${product._id}`} className="block font-semibold text-gray-900 mb-2 leading-tight hover:underline">
          {product.name}
        </Link>
        <div className="flex items-center space-x-1 mb-3">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-semibold text-gray-900">{product.averageRating.toFixed(1)}</span>
          <span className="text-sm text-gray-500">({product.ratingCount})</span>
        </div>
        <div className="flex items-baseline space-x-2 mb-4">
          <span className="text-xl font-bold text-gray-900">Npr {product.price}</span>
          {originalPrice ? <span className="text-sm text-gray-400 line-through">Npr {originalPrice}</span> : null}
        </div>
        <button className="w-full bg-black text-white py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors font-medium">
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};

const ShopContent: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [facetProducts, setFacetProducts] = useState<BackendProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedCategories = useMemo(() => parseListParam(searchParams.get("category")), [searchParamString]);
  const selectedBrands = useMemo(() => parseListParam(searchParams.get("brand")), [searchParamString]);
  const parsedMinPrice = Number(searchParams.get("minPrice") || 0);
  const minPrice = Number.isFinite(parsedMinPrice) ? parsedMinPrice : 0;
  const selectedMaxPrice = searchParams.get("maxPrice");

  useEffect(() => {
    const loadFacets = async () => {
      try {
        const data = await fetchProducts({ limit: 100, sortBy: "createdAt", order: "desc" });
        setFacetProducts(data?.products || []);
      } catch {
        setFacetProducts([]);
      }
    };

    loadFacets();
  }, []);

  const maxPrice = useMemo(() => {
    const highestPrice = Math.max(...facetProducts.map((product) => product.price), DEFAULT_MAX_PRICE);
    return Math.ceil(highestPrice / 100) * 100;
  }, [facetProducts]);

  const parsedMaxPrice = Number(selectedMaxPrice);
  const priceRange: [number, number] = [minPrice, selectedMaxPrice && Number.isFinite(parsedMaxPrice) ? parsedMaxPrice : maxPrice];

  const categories = useMemo(() => Array.from(new Set(facetProducts.map((product) => product.category))).filter(Boolean), [facetProducts]);
  const brands = useMemo(() => Array.from(new Set(facetProducts.map((product) => product.brand).filter(Boolean))) as string[], [facetProducts]);

  const updateUrl = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    const nextQuery = nextParams.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const toggleFilter = (key: "category" | "brand", value: string) => {
    const current = key === "category" ? selectedCategories : selectedBrands;
    const updated = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    updateUrl({ [key]: updated.length ? updated.join(",") : null });
  };

  const updatePriceRange = (range: [number, number]) => {
    updateUrl({
      minPrice: range[0] > 0 ? String(range[0]) : null,
      maxPrice: range[1] < maxPrice ? String(range[1]) : null,
    });
  };

  const resetFilters = () => router.push(pathname);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setError("");

      try {
        const params: Record<string, string | number | boolean> = {
          limit: 100,
          sortBy: "createdAt",
          order: "desc",
        };

        if (selectedCategories.length) params.category = selectedCategories.join(",");
        if (selectedBrands.length) params.brand = selectedBrands.join(",");
        if (priceRange[0] > 0) params.minPrice = priceRange[0];
        if (selectedMaxPrice) params.maxPrice = priceRange[1];

        const data = await fetchProducts(params);
        setProducts(data?.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load products.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [searchParamString, selectedCategories, selectedBrands, selectedMaxPrice, priceRange[0], priceRange[1]]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Shop Your Needs</h1>
          <p className="text-sm text-gray-500">{isLoading ? "Loading products..." : `Showing ${products.length} products`}</p>
        </div>

        {error ? <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Category</h3>
                <div className="space-y-3">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <FilterCheckbox key={cat} label={formatCategory(cat)} checked={selectedCategories.includes(cat)} onChange={() => toggleFilter("category", cat)} />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No categories yet.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-4">Price Range</h3>
                <DualRangeSlider min={0} max={maxPrice} value={priceRange} onChange={updatePriceRange} />
                <p className="text-xs text-gray-500 mt-2">Up to Npr {maxPrice}</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-4">Brand</h3>
                <div className="space-y-3">
                  {brands.length > 0 ? (
                    brands.map((brand) => (
                      <FilterCheckbox key={brand} label={brand} checked={selectedBrands.includes(brand)} onChange={() => toggleFilter("brand", brand)} />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No brands yet.</p>
                  )}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {isLoading ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">Loading products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {!isLoading && products.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No products match your filters.</p>
                <button onClick={resetFilters} className="mt-4 text-black font-semibold hover:underline">
                  Clear all filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-gray-500">Loading shop...</div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
