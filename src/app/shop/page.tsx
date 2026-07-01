"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronRight, Heart, Search, Star } from "lucide-react";
import {
  BackendProduct,
  fetchProducts,
  formatCategory,
  getCategoryOption,
  getOriginalPrice,
  getProductImage,
  productCategoryTree,
} from "@/features/products";
import { DiscountData, DiscountProduct, fetchPublicDiscounts } from "@/features/discounts";
import { AddToCartButton } from "@/features/cart";
import { useAuth, useToast, useWishlist } from "@/contexts";

const DEFAULT_MAX_PRICE = 3000;
const PRODUCT_PAGE_SIZE = 6;
const MIN_COMPARE_PRODUCTS = 3;
const MAX_COMPARE_PRODUCTS = 5;

type ProductPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

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

const parseCompareSlotCount = (value: string | null) => {
  const parsed = Number(value || MIN_COMPARE_PRODUCTS);
  const safeValue = Number.isFinite(parsed) ? Math.floor(parsed) : MIN_COMPARE_PRODUCTS;

  return Math.min(MAX_COMPARE_PRODUCTS, Math.max(MIN_COMPARE_PRODUCTS, safeValue));
};

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

const ProductCard: React.FC<{
  product: BackendProduct;
  compareMode?: boolean;
  isSelectedForCompare?: boolean;
  isCompareSelectionDisabled?: boolean;
  onCompareSelect?: (productId: string) => void;
  isFlashSale?: boolean;
  flashSalePercent?: number;
  isBestPrice?: boolean;
}> = ({ product, compareMode = false, isSelectedForCompare = false, isCompareSelectionDisabled = false, onCompareSelect, isFlashSale = false, flashSalePercent = 0, isBestPrice = false }) => {
  const discount = product.discountPercentage || 0;
  const originalPrice = getOriginalPrice(product);
  const effectivePrice = isFlashSale && flashSalePercent > 0 ? Math.round(product.price * (1 - flashSalePercent / 100)) : product.price;
  const showOriginalPrice = isFlashSale && flashSalePercent > 0 ? product.price : originalPrice;
  const { isAuthenticated } = useAuth();
  const { wishlistProductIds, toggleWishlistItem } = useWishlist();
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  const isWishlisted = wishlistProductIds.has(product._id);
  const isOutOfStock = product.stock <= 0;

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    setIsUpdatingWishlist(true);

    try {
      await toggleWishlistItem(product._id);
    } finally {
      setIsUpdatingWishlist(false);
    }
  };

  const handleCompareCardClick = () => {
    if (!compareMode || isCompareSelectionDisabled) return;
    onCompareSelect?.(product._id);
  };

  const cardClasses = [
    "bg-white rounded-lg overflow-hidden border hover:shadow-lg transition-shadow",
    compareMode ? "shop-compare-product-card" : "border-gray-100",
    isSelectedForCompare ? "selected" : "",
    isCompareSelectionDisabled ? "disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClasses}
      onClick={handleCompareCardClick}
      role={compareMode ? "button" : undefined}
      tabIndex={compareMode && !isCompareSelectionDisabled ? 0 : undefined}
      onKeyDown={(event) => {
        if (compareMode && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          handleCompareCardClick();
        }
      }}
      aria-pressed={compareMode ? isSelectedForCompare : undefined}
    >
      <div className="relative h-56 bg-gray-50">
        {compareMode ? (
          <div className="block h-full">
            {getProductImage(product) ? (
              <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="product-no-image">No image</div>
            )}
          </div>
        ) : (
          <Link href={`/products/${product._id}`} className="block h-full">
            {getProductImage(product) ? (
              <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="product-no-image">No image</div>
            )}
          </Link>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.verifiedBadge && (
            <div className="flex items-center space-x-1 bg-black text-white text-xs font-bold px-2 py-1 rounded">
              <CheckCircle2 className="w-3 h-3" />
              <span>VERIFIED</span>
            </div>
          )}
          {isFlashSale && flashSalePercent > 0 && (
            <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              SALE -{flashSalePercent}%
            </div>
          )}
          {!isFlashSale && discount > 0 && (
            <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">-{discount}%</div>
          )}
        </div>
        {compareMode ? (
          <span className="shop-compare-check">{isSelectedForCompare ? "Selected" : "Pick"}</span>
        ) : (
          <button
            type="button"
            className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100 transition-colors disabled:opacity-60"
            onClick={handleWishlistToggle}
            disabled={isUpdatingWishlist}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={isWishlisted}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-black text-black" : "text-gray-600"}`} />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">
          {[formatCategory(product.category), product.subcategory, product.brand || "FitFIXto"].filter(Boolean).join(" - ")}
        </div>
        {compareMode ? (
          <strong className="block font-semibold text-gray-900 mb-2 leading-tight">{product.name}</strong>
        ) : (
          <Link href={`/products/${product._id}`} className="block font-semibold text-gray-900 mb-2 leading-tight hover:underline">
            {product.name}
          </Link>
        )}
        <div className="flex items-center space-x-1 mb-3">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-semibold text-gray-900">{product.averageRating.toFixed(1)}</span>
          <span className="text-sm text-gray-500">({product.ratingCount})</span>
        </div>
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 mb-4">
          <span className="text-xl font-bold text-gray-900">Npr {effectivePrice}</span>
          {showOriginalPrice && showOriginalPrice !== effectivePrice ? <span className="text-sm text-gray-400 line-through">Npr {showOriginalPrice}</span> : null}
          {isBestPrice && <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded">Best Price</span>}
        </div>
        {isOutOfStock ? <div className="mb-3 text-sm font-black text-orange-600">Out of stock</div> : null}
        {isOutOfStock ? (
          <button
            type="button"
            onClick={(event) => {
              if (compareMode) event.stopPropagation();
              handleWishlistToggle();
            }}
            disabled={isUpdatingWishlist}
            className="w-full bg-black text-white py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors font-medium disabled:opacity-60"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-white text-white" : ""}`} />
            <span>{isWishlisted ? "Wishlisted" : "Add to Wishlist"}</span>
          </button>
        ) : (
          <AddToCartButton
            productId={product._id}
            stock={product.stock}
            stopPropagation={compareMode}
            className="w-full bg-black text-white py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors font-medium"
          />
        )}
      </div>
    </div>
  );
};

const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
    {Array.from({ length: PRODUCT_PAGE_SIZE }, (_, item) => (
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white" key={item}>
        <div className="h-56 animate-pulse bg-gray-100" />
        <div className="space-y-4 p-4">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
          <div className="h-6 w-5/6 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-7 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
    ))}
  </div>
);

const getPaginationPages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
};

const ShopContent: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const searchParamString = searchParams.toString();
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [facetProducts, setFacetProducts] = useState<BackendProduct[]>([]);
  const [pagination, setPagination] = useState<ProductPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [discounts, setDiscounts] = useState<DiscountData | null>(null);

  const selectedCategories = useMemo(() => parseListParam(searchParams.get("category")), [searchParamString]);
  const selectedSubcategories = useMemo(() => parseListParam(searchParams.get("subcategory")), [searchParamString]);
  const selectedBrands = useMemo(() => parseListParam(searchParams.get("brand")), [searchParamString]);
  const isComparePickMode = searchParams.get("compare") === "1";
  const compareSlotCount = parseCompareSlotCount(searchParams.get("slots"));
  const selectedCompareIds = useMemo(() => parseListParam(searchParams.get("ids")).slice(0, compareSlotCount), [searchParamString, compareSlotCount]);
  const searchQuery = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const parsedMinPrice = Number(searchParams.get("minPrice") || 0);
  const minPrice = Number.isFinite(parsedMinPrice) ? parsedMinPrice : 0;
  const selectedMaxPrice = searchParams.get("maxPrice");
  const parsedPage = Number(searchParams.get("page") || 1);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const loadFacets = async () => {
      const [productsResult, discountsResult] = await Promise.allSettled([
        fetchProducts({ limit: 100, sortBy: "createdAt", order: "desc" }),
        fetchPublicDiscounts(),
      ]);
      setFacetProducts(productsResult.status === "fulfilled" ? productsResult.value?.products ?? [] : []);
      if (discountsResult.status === "fulfilled") setDiscounts(discountsResult.value);
    };

    loadFacets();
  }, []);

  const maxPrice = useMemo(() => {
    const highestPrice = Math.max(...facetProducts.map((product) => product.price), DEFAULT_MAX_PRICE);
    return Math.ceil(highestPrice / 100) * 100;
  }, [facetProducts]);

  const parsedMaxPrice = Number(selectedMaxPrice);
  const priceRange: [number, number] = [minPrice, selectedMaxPrice && Number.isFinite(parsedMaxPrice) ? parsedMaxPrice : maxPrice];

  const categories = useMemo(() => {
    const optionMap = new Map<string, { label: string; value: string; subcategories: string[] }>();

    productCategoryTree.forEach((category) => optionMap.set(category.value, category));
    facetProducts.forEach((product) => {
      if (!product.category) return;
      const existing = optionMap.get(product.category);
      const subcategories = new Set(existing?.subcategories || []);
      if (product.subcategory) subcategories.add(product.subcategory);
      optionMap.set(product.category, {
        label: formatCategory(product.category),
        value: product.category,
        subcategories: Array.from(subcategories),
      });
    });

    return Array.from(optionMap.values());
  }, [facetProducts]);
  const brands = useMemo(() => Array.from(new Set(facetProducts.map((product) => product.brand).filter(Boolean))) as string[], [facetProducts]);

  const flashSalePercent = discounts?.flashSale?.isActive ? discounts.flashSale.discountPercentage : 0;
  const flashSaleActiveIds = useMemo<Set<string> | null>(() => {
    const fs = discounts?.flashSale;
    if (!fs?.isActive) return null;
    const ids = (fs.productIds as Array<string | DiscountProduct>).map((p) => (typeof p === "string" ? p : p._id));
    return ids.length > 0 ? new Set(ids) : null;
  }, [discounts]);
  const bestPriceIds = useMemo<Set<string>>(
    () => new Set((discounts?.bestPriceProductIds ?? []).map((p) => p._id)),
    [discounts]
  );

  const updateUrl = useCallback((updates: Record<string, string | null>, mode: "push" | "replace" = "push") => {
    const nextParams = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    if (mode === "replace") {
      router.replace(nextUrl);
    } else {
      router.push(nextUrl);
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const normalizedInput = searchInput.trim();

    if (normalizedInput === searchQuery) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      updateUrl({ search: normalizedInput || null, page: null }, "replace");
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, searchQuery, updateUrl]);

  const toggleFilter = (key: "category" | "subcategory" | "brand", value: string) => {
    const current = key === "category" ? selectedCategories : key === "subcategory" ? selectedSubcategories : selectedBrands;
    const updated = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    const nextUpdates: Record<string, string | null> = { [key]: updated.length ? updated.join(",") : null, page: null };

    if (key === "category") {
      setExpandedCategories((currentExpanded) => new Set(currentExpanded).add(value));
      const subcategoriesForCategory = getCategoryOption(value)?.subcategories || [];
      const nextSubcategories = selectedSubcategories.filter((subcategory) => !subcategoriesForCategory.includes(subcategory));
      nextUpdates.subcategory = nextSubcategories.length ? nextSubcategories.join(",") : null;
    }

    updateUrl(nextUpdates);
  };

  const toggleCategoryBranch = (category: string) => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const updatePriceRange = (range: [number, number]) => {
    updateUrl({
      minPrice: range[0] > 0 ? String(range[0]) : null,
      maxPrice: range[1] < maxPrice ? String(range[1]) : null,
      page: null,
    });
  };

  const resetFilters = () => router.push(pathname);
  const compareIdsQuery = selectedCompareIds.join(",");
  const compareHref = compareIdsQuery
    ? `/compare?ids=${encodeURIComponent(compareIdsQuery)}&slots=${compareSlotCount}`
    : `/compare?slots=${compareSlotCount}`;

  const toggleCompareProduct = (productId: string) => {
    const isSelected = selectedCompareIds.includes(productId);
    const nextIds = isSelected
      ? selectedCompareIds.filter((id) => id !== productId)
      : selectedCompareIds.length < compareSlotCount
        ? [...selectedCompareIds, productId]
        : selectedCompareIds;

    updateUrl({ compare: "1", ids: nextIds.length ? nextIds.join(",") : null, slots: String(compareSlotCount) }, "replace");
  };

  const goToPage = (page: number) => {
    updateUrl({ page: page > 1 ? String(page) : null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);

      try {
        const params: Record<string, string | number | boolean> = {
          page: currentPage,
          limit: PRODUCT_PAGE_SIZE,
          sortBy: "createdAt",
          order: "desc",
        };

        if (selectedCategories.length) params.category = selectedCategories.join(",");
        if (selectedSubcategories.length) params.subcategory = selectedSubcategories.join(",");
        if (selectedBrands.length) params.brand = selectedBrands.join(",");
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (priceRange[0] > 0) params.minPrice = priceRange[0];
        if (selectedMaxPrice) params.maxPrice = priceRange[1];

        const data = await fetchProducts(params);
        setProducts(data?.products || []);
        setPagination(data?.pagination || null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to load products.");
        setPagination(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [searchParamString, selectedCategories, selectedSubcategories, selectedBrands, searchQuery, selectedMaxPrice, priceRange[0], priceRange[1], currentPage]);

  const totalProducts = pagination?.total ?? products.length;
  const totalPages = pagination?.totalPages ?? 1;
  const paginationPages = getPaginationPages(currentPage, totalPages);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isComparePickMode ? (
          <div className="shop-compare-picker-bar">
            <div>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 7h9.5A2.5 2.5 0 0 1 19 9.5V17" />
                <path d="m16 14 3 3 3-3" />
                <path d="M17 17H7.5A2.5 2.5 0 0 1 5 14.5V7" />
                <path d="m8 10-3-3-3 3" />
              </svg>
              <strong>Pick a product to add to Compare ({selectedCompareIds.length}/{compareSlotCount})</strong>
            </div>
            <Link href={compareHref}>← Back to Compare</Link>
          </div>
        ) : null}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{isComparePickMode ? "Shop Equipment" : "Shop Your Needs"}</h1>
          <p className="text-sm text-gray-500">
            {isLoading
              ? "Loading products..."
              : searchQuery
                ? `Showing ${products.length} of ${totalProducts} products for "${searchQuery}"`
                : `Showing ${products.length} of ${totalProducts} products`}
          </p>
          <label className="relative mt-5 block w-full max-w-xl">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products..."
              className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </label>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Category</h3>
                <div className="space-y-3">
                  {categories.length > 0 ? (
                    categories.map((category) => {
                      const isExpanded =
                        expandedCategories.has(category.value) ||
                        selectedCategories.includes(category.value) ||
                        category.subcategories.some((subcategory) => selectedSubcategories.includes(subcategory));

                      return (
                        <div className="shop-category-branch" key={category.value}>
                          <div className="shop-category-row">
                            <button
                              type="button"
                              className={isExpanded ? "expanded" : undefined}
                              onClick={() => toggleCategoryBranch(category.value)}
                              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${category.label}`}
                            >
                              <ChevronRight aria-hidden="true" />
                            </button>
                            <FilterCheckbox
                              label={category.label}
                              checked={selectedCategories.includes(category.value)}
                              onChange={() => toggleFilter("category", category.value)}
                            />
                          </div>
                          {isExpanded && category.subcategories.length ? (
                            <div className="shop-subcategory-list">
                              {category.subcategories.map((subcategory) => (
                                <FilterCheckbox
                                  key={`${category.value}-${subcategory}`}
                                  label={subcategory}
                                  checked={selectedSubcategories.includes(subcategory)}
                                  onChange={() => toggleFilter("subcategory", subcategory)}
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
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
              <ProductGridSkeleton />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    compareMode={isComparePickMode}
                    isSelectedForCompare={selectedCompareIds.includes(product._id)}
                    isCompareSelectionDisabled={!selectedCompareIds.includes(product._id) && selectedCompareIds.length >= compareSlotCount}
                    onCompareSelect={toggleCompareProduct}
                    isFlashSale={flashSalePercent > 0 && (flashSaleActiveIds === null || flashSaleActiveIds.has(product._id))}
                    flashSalePercent={flashSalePercent}
                    isBestPrice={bestPriceIds.has(product._id)}
                  />
                ))}
              </div>
            )}

            {!isLoading && products.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
                <h2 className="text-2xl font-black text-gray-950">No products found</h2>
                <p className="mt-3 text-lg text-gray-500">
                  {searchQuery ? `No products match "${searchQuery}" with the current filters.` : "No products match your current filters."}
                </p>
                <button onClick={resetFilters} className="mt-6 rounded-md bg-[#020011] px-6 py-3 font-semibold text-white">
                  Clear all filters
                </button>
              </div>
            )}

            {!isLoading && products.length > 0 && totalPages > 1 ? (
              <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Shop pagination">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!pagination?.hasPrevPage}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-bold text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                {paginationPages.map((page) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => goToPage(page)}
                    aria-current={page === currentPage ? "page" : undefined}
                    className={`h-10 min-w-10 rounded-md border px-3 text-sm font-black ${
                      page === currentPage ? "border-[#020011] bg-[#020011] text-white" : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!pagination?.hasNextPage}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-bold text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            ) : null}
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
