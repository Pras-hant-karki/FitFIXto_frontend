"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Heart, Star } from "lucide-react";
import { AddToCartButton } from "@/features/cart";
import {
  BackendProduct,
  fetchProduct,
  fetchProducts,
  formatCategory,
  getOriginalPrice,
  getProductImage,
} from "@/features/products";

const formatMoney = (value: number) => `Npr ${Math.round(value).toLocaleString()}`;

const ProductTile = ({ product }: { product: BackendProduct }) => (
  <Link href={`/products/${product._id}`} className="product-detail-related-card">
    <div>
      {getProductImage(product) ? <img src={getProductImage(product)} alt={product.name} /> : <span>No image</span>}
    </div>
    <strong>{product.name}</strong>
    <small>
      {formatCategory(product.category)} - {product.brand || "FitFIXto"}
    </small>
    <b>{formatMoney(product.price)}</b>
  </Link>
);

const ProductDetailsSkeleton = () => (
  <main className="product-detail-page">
    <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
    <section className="product-detail-hero">
      <div className="product-detail-gallery">
        <div className="product-detail-main-image animate-pulse bg-gray-100" />
        <div className="product-detail-thumbs">
          {[0, 1, 2].map((item) => (
            <div className="h-20 w-20 animate-pulse rounded-lg bg-gray-100" key={item} />
          ))}
        </div>
      </div>
      <div className="product-detail-info">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
        <div className="h-10 w-4/5 animate-pulse rounded bg-gray-100" />
        <div className="h-5 w-36 animate-pulse rounded bg-gray-100" />
        <div className="h-11 w-44 animate-pulse rounded bg-gray-100" />
        <div className="h-8 w-28 animate-pulse rounded bg-gray-100" />
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="flex gap-3">
          <div className="h-12 w-44 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
    </section>
    <section className="product-detail-specs">
      <div className="h-8 w-40 animate-pulse rounded bg-gray-100" />
      <div>
        {[0, 1, 2, 3].map((item) => (
          <article key={item}>
            <span className="h-4 w-24 animate-pulse rounded bg-gray-100" />
            <strong className="h-5 w-32 animate-pulse rounded bg-gray-100" />
          </article>
        ))}
      </div>
    </section>
  </main>
);

export default function ProductDetailsPage() {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;
  const [product, setProduct] = useState<BackendProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<BackendProduct[]>([]);
  const [activeImage, setActiveImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextProduct = await fetchProduct(productId);
        if (!nextProduct) {
          throw new Error("Product not found.");
        }

        setProduct(nextProduct);
        setActiveImage(getProductImage(nextProduct));

        const related = await fetchProducts({
          category: nextProduct.category,
          isActive: true,
          limit: 4,
          sortBy: "createdAt",
          order: "desc",
        });
        setRelatedProducts((related?.products || []).filter((item) => item._id !== nextProduct._id).slice(0, 3));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load product.");
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const galleryImages = useMemo(() => product?.images.filter(Boolean) || [], [product]);
  const originalPrice = product ? getOriginalPrice(product) : null;
  const dimensions = product?.dimensions;
  const specs = product
    ? [
        { label: "Category", value: formatCategory(product.category) },
        { label: "Subcategory", value: product.subcategory || "Not assigned" },
        { label: "Brand", value: product.brand || "FitFIXto" },
        { label: "SKU", value: product.sku || "Not assigned" },
        { label: "Weight", value: product.weight ? `${product.weight} kg` : "Not specified" },
        {
          label: "Dimensions",
          value:
            dimensions?.length || dimensions?.width || dimensions?.height
              ? `${dimensions.length || "-"}" x ${dimensions.width || "-"}" x ${dimensions.height || "-"}"`
              : "Not specified",
        },
      ]
    : [];

  if (isLoading) {
    return <ProductDetailsSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="product-detail-state">
        <strong>{error || "Product not found."}</strong>
        <span>We could not load this product right now.</span>
        <div>
          <button type="button" onClick={() => window.location.reload()}>
            Try Again
          </button>
          <Link href="/shop">Back to shop</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="product-detail-page">
      <Link href="/shop" className="product-detail-back">
        <ArrowLeft aria-hidden="true" />
        Back to shop
      </Link>

      <section className="product-detail-hero">
        <div className="product-detail-gallery">
          <div className="product-detail-main-image">
            {activeImage ? <img src={activeImage} alt={product.name} /> : <span>No image</span>}
          </div>
          {galleryImages.length > 1 ? (
            <div className="product-detail-thumbs">
              {galleryImages.map((image) => (
                <button type="button" className={activeImage === image ? "active" : undefined} onClick={() => setActiveImage(image)} key={image}>
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="product-detail-info">
          <div className="product-detail-badges">
            {product.verifiedBadge ? (
              <span>
                <CheckCircle2 aria-hidden="true" />
                Verified
              </span>
            ) : null}
            {product.isFeatured ? <span>Featured</span> : null}
          </div>
          <p>{[formatCategory(product.category), product.subcategory].filter(Boolean).join(" - ")}</p>
          <h1>{product.name}</h1>
          <div className="product-detail-rating">
            <Star aria-hidden="true" />
            <strong>{product.averageRating.toFixed(1)}</strong>
            <span>{product.ratingCount} reviews</span>
          </div>
          <div className="product-detail-price">
            <strong>{formatMoney(product.price)}</strong>
            {originalPrice ? <span>{formatMoney(originalPrice)}</span> : null}
          </div>
          <div className={product.stock > 0 ? "product-detail-stock in-stock" : "product-detail-stock out-stock"}>
            {product.stock > 0 ? `${product.stock} pc in stock` : "Out of stock"}
          </div>
          <p className="product-detail-description">{product.description}</p>
          <div className="product-detail-actions">
            <AddToCartButton productId={product._id} stock={product.stock} />
            <button type="button">
              <Heart aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <section className="product-detail-specs">
        <h2>Specifications</h2>
        <div>
          {specs.map((spec) => (
            <article key={spec.label}>
              <span>{spec.label}</span>
              <strong>{spec.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="product-detail-related">
        <div>
          <h2>Related Products</h2>
          <Link href={`/shop?category=${product.category}`}>View category</Link>
        </div>
        {relatedProducts.length ? (
          <div className="product-detail-related-grid">
            {relatedProducts.map((item) => (
              <ProductTile product={item} key={item._id} />
            ))}
          </div>
        ) : (
          <div className="product-detail-empty">
            <strong>No related products yet.</strong>
            <span>More items from this category will appear here when they are available.</span>
          </div>
        )}
      </section>
    </main>
  );
}
