"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AddToCartButton } from "@/features/cart";
import { useToast } from "@/contexts";
import {
  BackendProduct,
  fetchComparedProducts,
  fetchProduct,
  getProductImage,
} from "@/features/products";

const MIN_COMPARE_PRODUCTS = 3;
const MAX_COMPARE_PRODUCTS = 5;

const parseCompareIds = (value: string | null) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, MAX_COMPARE_PRODUCTS)
    : [];

const parseSlotCount = (value: string | null, selectedCount: number) => {
  const parsed = Number(value || MIN_COMPARE_PRODUCTS);
  const safeValue = Number.isFinite(parsed) ? Math.floor(parsed) : MIN_COMPARE_PRODUCTS;

  return Math.min(MAX_COMPARE_PRODUCTS, Math.max(MIN_COMPARE_PRODUCTS, selectedCount, safeValue));
};

const formatDimensions = (product: BackendProduct) => {
  const dimensions = product.dimensions;

  if (!dimensions || (!dimensions.length && !dimensions.width && !dimensions.height)) {
    return "—";
  }

  return [dimensions.length, dimensions.width, dimensions.height]
    .map((value) => (value ? `${value}"` : "—"))
    .join(" x ");
};

const getCondition = (product: BackendProduct) =>
  product.tags?.some((tag) => tag.toLowerCase().includes("refurbished")) ? "Refurbished" : "New";

const getCompareValue = (row: string, product?: BackendProduct) => {
  if (!product) return "—";

  switch (row) {
    case "Brand":
      return product.brand || "FitFIXto";
    case "Price":
      return `Npr ${product.price}`;
    case "Rating":
      return `${product.averageRating.toFixed(1)} (${product.ratingCount})`;
    case "Condition":
      return getCondition(product);
    case "Warranty":
      return product.warrantyMonths !== undefined ? `${product.warrantyMonths} months` : product.specifications || "—";
    case "Capacity":
      return product.stock > 0 ? `${product.stock} pc in stock` : "Out of stock";
    case "Weight":
      return product.weight ? `${product.weight} ${product.weightUnit || "kg"}` : "—";
    case "Dimensions":
      return formatDimensions(product);
    case "Verified":
      return product.verifiedBadge ? "Yes" : "No";
    default:
      return "—";
  }
};

const compareRows = ["Brand", "Price", "Rating", "Condition", "Warranty", "Capacity", "Weight", "Dimensions", "Verified"];

const CompareProductCard = ({ product }: { product: BackendProduct }) => (
  <article className="compare-product-card">
    <div className="compare-product-image">
      {getProductImage(product) ? <img src={getProductImage(product)} alt={product.name} /> : <div>No image</div>}
      {product.verifiedBadge ? <span>Verified</span> : null}
    </div>
    <strong>{product.name}</strong>
    <AddToCartButton productId={product._id} stock={product.stock} />
  </article>
);

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const selectedIds = useMemo(() => parseCompareIds(searchParams.get("ids")), [searchParams]);
  const slotCount = useMemo(() => parseSlotCount(searchParams.get("slots"), selectedIds.length), [searchParams, selectedIds.length]);
  const compareSlots = useMemo(() => Array.from({ length: slotCount }, (_, index) => index), [slotCount]);
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const idsQuery = selectedIds.join(",");
  const shopPickHref = idsQuery
    ? `/shop?compare=1&ids=${encodeURIComponent(idsQuery)}&slots=${slotCount}`
    : `/shop?compare=1&slots=${slotCount}`;

  const handleAddSlot = () => {
    const nextSlotCount = Math.min(MAX_COMPARE_PRODUCTS, slotCount + 1);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("slots", String(nextSlotCount));
    if (idsQuery) {
      nextParams.set("ids", idsQuery);
    }
    router.push(`/compare?${nextParams.toString()}`);
  };

  useEffect(() => {
    let isActive = true;

    const loadComparedProducts = async () => {
      if (selectedIds.length === 0) {
        setProducts([]);
        return;
      }

      setIsLoading(true);

      try {
        const comparedProducts =
          selectedIds.length === 1
            ? [await fetchProduct(selectedIds[0])]
            : await fetchComparedProducts(selectedIds);
        const orderedProducts = selectedIds
          .map((id) => comparedProducts.find((product) => product?._id === id))
          .filter(Boolean) as BackendProduct[];

        if (isActive) {
          setProducts(orderedProducts);
        }
      } catch (err) {
        if (isActive) {
          toast.error(err instanceof Error ? err.message : "Unable to load compared products.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadComparedProducts();

    return () => {
      isActive = false;
    };
  }, [idsQuery, selectedIds]);

  const displayProducts = compareSlots.map((slot) => products[slot]);

  return (
    <section className="compare-page">
      <header className="compare-header">
        <h1>Compare Products</h1>
        <p>Compare up to 5 products side-by-side. Click <strong>Add Product</strong> to pick one from the shop - you won&apos;t open the detail page.</p>
      </header>

      {isLoading ? <p className="compare-loading">Loading compared products...</p> : null}

      <div
        className="compare-slots"
        aria-label="Products selected for comparison"
        style={{ gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))` }}
      >
        {compareSlots.map((slot) => {
          const product = displayProducts[slot];

          return product ? (
            <CompareProductCard product={product} key={product._id} />
          ) : (
            <Link className="compare-add-card" href={shopPickHref} key={slot}>
              <Plus aria-hidden="true" />
              <span>Add Product</span>
            </Link>
          );
        })}
      </div>

      <div className="compare-table" aria-label="Product comparison table">
        {compareRows.map((row) => (
          <div
            className="compare-row"
            key={row}
            style={{ gridTemplateColumns: `230px repeat(${slotCount}, minmax(0, 1fr))` }}
          >
            <strong>{row}</strong>
            {displayProducts.map((product, slot) => (
              <span key={`${row}-${slot}`}>{getCompareValue(row, product)}</span>
            ))}
          </div>
        ))}
      </div>

      {slotCount < MAX_COMPARE_PRODUCTS ? (
        <button type="button" className="compare-add-more" onClick={handleAddSlot}>
          + Add more products ({slotCount}/{MAX_COMPARE_PRODUCTS})
        </button>
      ) : (
        <p className="compare-max-message">Max 5 products reached.</p>
      )}

      <Link href="/shop" className="compare-back-link">
        &larr; Back to shop
      </Link>
    </section>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<section className="compare-page">Loading compare...</section>}>
      <CompareContent />
    </Suspense>
  );
}
