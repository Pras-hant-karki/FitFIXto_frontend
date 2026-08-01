"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Heart, RotateCcw, ShieldCheck, Star, Truck, Zap } from "lucide-react";
import { AddToCartButton } from "@/features/cart";
import { useAuth, useWishlist } from "@/contexts";
import {
  BackendProduct,
  fetchProduct,
  fetchProducts,
  formatCategory,
  getOriginalPrice,
  getProductImage,
} from "@/features/products";
import { resolveAssetUrl } from "@/constants/api";
import { DiscountData, fetchPublicDiscounts } from "@/features/discounts";
import { BackendReview, fetchReviews } from "@/features/reviews";

const formatMoney = (value: number) => `Npr ${Math.round(value).toLocaleString()}`;

const ProductTile = ({ product }: { product: BackendProduct }) => (
  <Link href={`/products/${product._id}`} className="product-detail-related-card">
    <div>
      {product.verifiedBadge ? <span className="product-detail-related-badge">Verified</span> : null}
      {getProductImage(product) ? <img src={getProductImage(product)} alt={product.name} /> : <span>No image</span>}
    </div>
    <small>
      {formatCategory(product.category)} - {product.brand || "FitFIXto"}
    </small>
    <strong>{product.name}</strong>
    <small className="product-detail-related-rating">
      <Star aria-hidden="true" />
      {product.averageRating.toFixed(1)} ({product.ratingCount})
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
  const router = useRouter();
  const pathname = usePathname();
  const productId = params.productId;
  const [product, setProduct] = useState<BackendProduct | null>(null);
  const [discounts, setDiscounts] = useState<DiscountData | null>(null);
  const [reviews, setReviews] = useState<BackendReview[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<BackendProduct[]>([]);
  const [activeImage, setActiveImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  const [wishlistJustAdded, setWishlistJustAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "faq">("reviews");
  const { isAuthenticated } = useAuth();
  const { wishlistProductIds, toggleWishlistItem } = useWishlist();

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

        const [related, reviewData] = await Promise.all([
          fetchProducts({ category: nextProduct.category, limit: 4, sortBy: "createdAt", order: "desc" }),
          fetchReviews({ productId: nextProduct._id, limit: 5 }),
        ]);
        fetchPublicDiscounts().then(setDiscounts).catch(() => {});
        setRelatedProducts((related?.products || []).filter((item) => item._id !== nextProduct._id).slice(0, 4));
        setReviews(reviewData?.reviews || []);
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

  const galleryImages = useMemo(
    () => (product?.images.filter(Boolean) || []).map(resolveAssetUrl),
    [product]
  );
  const originalPrice = product ? getOriginalPrice(product) : null;

  const flashSale = discounts?.flashSale;
  const isFlashSale = Boolean(
    product &&
      flashSale?.isActive &&
      (!(flashSale.productIds as { _id: string }[]).length ||
        (flashSale.productIds as { _id: string }[]).some((p) => p._id === product._id))
  );
  const flashSalePercent = isFlashSale ? flashSale!.discountPercentage : 0;
  const isBestPrice = Boolean(product && discounts?.bestPriceProductIds.some((p) => p._id === product._id));
  const effectivePrice = product
    ? isFlashSale
      ? Math.round(product.price * (1 - flashSalePercent / 100))
      : product.price
    : 0;
  const displayOriginalPrice = isFlashSale ? product?.price ?? null : originalPrice;
  const displayDiscountPct = isFlashSale ? flashSalePercent : product?.discountPercentage || 0;

  const dimensions = product?.dimensions;
  const isWishlisted = product ? wishlistProductIds.has(product._id) : false;
  const isOutOfStock = product ? product.stock <= 0 : false;
  const handleWishlistToggle = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    const wasWishlisted = wishlistProductIds.has(product._id);
    setIsUpdatingWishlist(true);
    try {
      await toggleWishlistItem(product._id);
      if (!wasWishlisted) {
        setWishlistJustAdded(true);
        window.setTimeout(() => setWishlistJustAdded(false), 300);
      }
    } finally {
      setIsUpdatingWishlist(false);
    }
  };
  const dimensionsLabel =
    dimensions?.length || dimensions?.width || dimensions?.height
      ? `${dimensions.length || "-"}" x ${dimensions.width || "-"}" x ${dimensions.height || "-"}"`
      : "Not specified";
  const weightLabel = product?.weight ? `${product.weight} ${product.weightUnit || "kg"}` : "Not specified";
  const warrantyLabel =
    product?.warrantyMonths !== undefined && product.warrantyMonths > 0
      ? `${product.warrantyMonths} month${product.warrantyMonths === 1 ? "" : "s"}`
      : "Not specified";
  const specs = product
    ? [
        { label: "Weight", value: weightLabel },
        { label: "Category", value: formatCategory(product.category) },
        { label: "Subcategory", value: product.subcategory || "Not assigned" },
        { label: "Brand", value: product.brand || "FitFIXto" },
        { label: "SKU", value: product.sku || "Not assigned" },
        { label: "Warranty", value: warrantyLabel },
        { label: "Dimensions", value: dimensionsLabel },
      ]
    : [];
  const faqItems = product
    ? [
        {
          question: "What's included?",
          answer: `${product.name} ships with the product package and any accessories confirmed by the FitFIXto admin record.`,
        },
        {
          question: "Do you ship inside Nepal?",
          answer: "Yes. Available delivery methods and final shipping costs are shown during checkout.",
        },
        {
          question: "What's the warranty?",
          answer:
            product.warrantyMonths !== undefined && product.warrantyMonths > 0
              ? `${product.name} currently has ${warrantyLabel} warranty support, subject to product condition, order record, and supplier policy.`
              : "Warranty has not been specified for this product yet. FitFIXto support will confirm the policy before after-sales service.",
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
            {isFlashSale ? (
              <span className="product-detail-badge-flash">
                <Zap aria-hidden="true" />
                Flash Sale
              </span>
            ) : null}
            {isBestPrice ? <span className="product-detail-badge-best">Best Price</span> : null}
          </div>
          <p>{[formatCategory(product.category), product.subcategory].filter(Boolean).join(" - ")}</p>
          <h1>{product.name}</h1>
          <div className="product-detail-rating">
            <Star aria-hidden="true" />
            <strong>{product.averageRating.toFixed(1)}</strong>
            <span>{product.ratingCount} reviews</span>
          </div>
          <div className="product-detail-price">
            <strong>{formatMoney(effectivePrice)}</strong>
            {displayOriginalPrice ? <span>{formatMoney(displayOriginalPrice)}</span> : null}
            {displayDiscountPct > 0 ? <em className="product-detail-discount-badge">-{displayDiscountPct}%</em> : null}
          </div>
          <div className={product.stock > 0 ? "product-detail-stock in-stock" : "product-detail-stock out-stock"}>
            {product.stock > 0 ? `${product.stock} pc in stock` : "Out of stock"}
          </div>
          <p className="product-detail-description">{product.description}</p>
          <div className="product-detail-quality">
            <ShieldCheck aria-hidden="true" />
            <span>{product.verifiedBadge ? "Quality guaranteed by FitFIXto" : "Quality review pending"}</span>
          </div>
          <div className={`product-detail-actions${isOutOfStock ? " wishlist-only" : ""}`}>
            {isOutOfStock ? null : <AddToCartButton productId={product._id} stock={product.stock} />}
            <button
              type="button"
              className={`wishlist-button${isWishlisted ? " active" : ""}${wishlistJustAdded ? " just-added" : ""}`}
              onClick={handleWishlistToggle}
              disabled={isUpdatingWishlist}
              aria-pressed={isWishlisted}
            >
              <Heart aria-hidden="true" />
              {isOutOfStock ? <span>{isWishlisted ? "Wishlisted" : "Add to Wishlist"}</span> : null}
            </button>
          </div>
          <div className="product-detail-benefits">
            <article>
              <Truck aria-hidden="true" />
              <span>Free Shipping</span>
            </article>
            <article>
              <ShieldCheck aria-hidden="true" />
              <span>Warranty</span>
            </article>
            <article>
              <RotateCcw aria-hidden="true" />
              <span>10-Day Returns</span>
            </article>
          </div>

          <section className="product-detail-spec-table" aria-label="Product specifications">
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
        </div>
      </section>

      <section className="product-detail-reviews">
        <div className="product-detail-tabs" role="tablist" aria-label="Product information tabs">
          <button
            type="button"
            className={activeTab === "reviews" ? "active" : undefined}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews ({product.ratingCount})
          </button>
          <button type="button" className={activeTab === "faq" ? "active" : undefined} onClick={() => setActiveTab("faq")}>
            FAQ
          </button>
        </div>

        {activeTab === "reviews" ? (
          <>
            <div className="product-detail-review-summary">
              <h2>Customer Reviews</h2>
              <span>
                {product.averageRating.toFixed(1)} average from {product.ratingCount} review{product.ratingCount === 1 ? "" : "s"}
              </span>
            </div>

            {reviews.length ? (
              <div className="product-detail-review-list">
                {reviews.map((review) => {
                  const reviewer =
                    typeof review.userId === "string"
                      ? "Customer"
                      : `${review.userId.firstName} ${review.userId.lastName}`.trim() || review.userId.email.split("@")[0];

                  return (
                    <article className="product-detail-review-card" key={review._id}>
                      <div>
                        <strong>{reviewer}</strong>
                        <span>{new Intl.DateTimeFormat("en-CA").format(new Date(review.createdAt))}</span>
                      </div>
                      <div className="product-detail-review-stars" aria-label={`${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Star className={rating <= review.rating ? "active" : undefined} aria-hidden="true" key={rating} />
                        ))}
                      </div>
                      {review.comment ? <p>{review.comment}</p> : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="product-detail-empty">
                <strong>No reviews yet.</strong>
                <span>Reviews from delivered customer orders will appear here.</span>
              </div>
            )}
          </>
        ) : (
          <div className="product-detail-faq-list">
            {faqItems.map((item) => (
              <article key={item.question}>
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        )}
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
