"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, ShoppingCart } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  BackendProduct,
  fetchComparedProducts,
  fetchProduct,
  getProductImage,
} from "@/features/products";

const MAX_COMPARE_PRODUCTS = 3;
const compareSlots = Array.from({ length: MAX_COMPARE_PRODUCTS }, (_, index) => index);

const parseCompareIds = (value: string | null) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, MAX_COMPARE_PRODUCTS)
    : [];

const formatDimensions = (product: BackendProduct) => {
  const dimensions = product.dimensions;

  if (!dimensions || (!dimensions.length && !dimensions.width && !dimensions.height)) {
    return "—";
  }

  return [dimensions.length, dimensions.width, dimensions.height]
    .map((value) => (value ? `${value}` : "—"))
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
      return product.specifications || "—";
    case "Capacity":
      return product.stock > 0 ? `${product.stock} pc in stock` : "Out of stock";
    case "Weight":
      return product.weight ? `${product.weight}` : "—";
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
    <button type="button">
      <ShoppingCart aria-hidden="true" />
      Add to Cart
    </button>
  </article>
);

function CompareContent() {
  const searchParams = useSearchParams();
  const selectedIds = useMemo(() => parseCompareIds(searchParams.get("ids")), [searchParams]);
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const idsQuery = selectedIds.join(",");
  const shopPickHref = idsQuery ? `/shop?compare=1&ids=${encodeURIComponent(idsQuery)}` : "/shop?compare=1";

  useEffect(() => {
    let isActive = true;

    const loadComparedProducts = async () => {
      if (selectedIds.length === 0) {
        setProducts([]);
        setError("");
        return;
      }

      setIsLoading(true);
      setError("");

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
          setError(err instanceof Error ? err.message : "Unable to load compared products.");
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

      {error ? <p className="compare-error">{error}</p> : null}
      {isLoading ? <p className="compare-loading">Loading compared products...</p> : null}

      <div className="compare-slots" aria-label="Products selected for comparison">
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
          <div className="compare-row" key={row}>
            <strong>{row}</strong>
            {displayProducts.map((product, slot) => (
              <span key={`${row}-${slot}`}>{getCompareValue(row, product)}</span>
            ))}
          </div>
        ))}
      </div>

      <Link href={shopPickHref} className="compare-add-more">
        + Add more products ({selectedIds.length}/{MAX_COMPARE_PRODUCTS})
      </Link>

      <Link href="/shop" className="compare-back-link">
        ← Back to shop
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
