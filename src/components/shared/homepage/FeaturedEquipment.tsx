"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Zap } from "lucide-react";
import {
  BackendProduct,
  fetchProducts,
  formatCategory,
  getOriginalPrice,
  getProductImage,
} from "@/features/products";
import { DiscountData, fetchPublicDiscounts } from "@/features/discounts";
import { AddToCartButton } from "@/features/cart";
import { useAuth, useWishlist } from "@/contexts";

const formatMoney = (value: number) => `Npr ${Math.round(value).toLocaleString()}`;

export function FeaturedEquipment() {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [discounts, setDiscounts] = useState<DiscountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingWishlistId, setUpdatingWishlistId] = useState("");
  const { isAuthenticated } = useAuth();
  const { wishlistProductIds, toggleWishlistItem } = useWishlist();

  const handleWishlistToggle = async (productId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    setUpdatingWishlistId(productId);

    try {
      await toggleWishlistItem(productId);
    } finally {
      setUpdatingWishlistId("");
    }
  };

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [data] = await Promise.all([
          fetchProducts({ isFeatured: true, limit: 4 }),
          fetchPublicDiscounts().then(setDiscounts).catch(() => {}),
        ]);
        setProducts(data?.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load featured equipment.");
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  const flashSale = discounts?.flashSale;
  const flashSalePercent = flashSale?.isActive ? flashSale.discountPercentage : 0;
  const flashSaleActiveIds =
    flashSale?.isActive && (flashSale.productIds as { _id: string }[]).length > 0
      ? new Set((flashSale.productIds as { _id: string }[]).map((p) => p._id))
      : null;
  const bestPriceIds = new Set((discounts?.bestPriceProductIds || []).map((p) => p._id));

  return (
    <section className="home-section" id="shop">
      <div className="section-inner">
        <div className="section-heading">
          <p>New Arrivals</p>
          <h2>Featured Equipment</h2>
          <span>Hand-picked, verified and ready to ship from our Kathmandu warehouse.</span>
        </div>

        {error ? <p className="auth-message error">{error}</p> : null}

        {isLoading ? (
          <div className="empty-state">
            <strong>Loading featured equipment...</strong>
            <span>Please wait while we check the latest products.</span>
          </div>
        ) : products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => {
              const discount = product.discountPercentage || 0;
              const originalPrice = getOriginalPrice(product);
              const isWishlisted = wishlistProductIds.has(product._id);
              const isUpdatingWishlist = updatingWishlistId === product._id;
              const isOutOfStock = product.stock <= 0;

              const isFlashSale =
                flashSalePercent > 0 &&
                (flashSaleActiveIds === null || flashSaleActiveIds.has(product._id));
              const isBestPrice = bestPriceIds.has(product._id);
              const effectivePrice = isFlashSale
                ? Math.round(product.price * (1 - flashSalePercent / 100))
                : product.price;
              const displayOriginalPrice = isFlashSale ? product.price : originalPrice;

              return (
                <article className="product-card" key={product._id}>
                  <div className="product-media">
                    <Link href={`/products/${product._id}`} className="product-media-link">
                      {getProductImage(product) ? (
                        <img src={getProductImage(product)} alt={product.name} />
                      ) : (
                        <div className="product-no-image">No image</div>
                      )}
                    </Link>
                    <div className="product-badges">
                      {product.verifiedBadge ? <span className="badge-dark">Verified</span> : null}
                      {isFlashSale ? (
                        <span className="badge-dark badge-flash">
                          <Zap aria-hidden="true" />
                          Flash
                        </span>
                      ) : null}
                      {isBestPrice ? <span className="badge-best-price">Best Price</span> : null}
                      {isFlashSale ? (
                        <span className="badge-sale-red">SALE -{flashSalePercent}%</span>
                      ) : discount > 0 ? (
                        <span className="badge-sale">-{discount}%</span>
                      ) : null}
                    </div>
                    <button
                      className={`wishlist-button${isWishlisted ? " active" : ""}`}
                      type="button"
                      onClick={() => handleWishlistToggle(product._id)}
                      disabled={isUpdatingWishlist}
                      aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                      aria-pressed={isWishlisted}
                    >
                      <Heart aria-hidden="true" />
                    </button>
                  </div>
                  <div className="product-body">
                    <p>
                      {[formatCategory(product.category), product.subcategory, product.brand || "FitFIXto"].filter(Boolean).join(" - ")}
                    </p>
                    <Link href={`/products/${product._id}`} className="product-title-link">
                      <h3>{product.name}</h3>
                    </Link>
                    <div className="rating-line">
                      <span aria-hidden="true">&#9733;</span>
                      <strong>{product.averageRating.toFixed(1)}</strong>
                      <small>({product.ratingCount})</small>
                    </div>
                    <div className="price-line">
                      <strong>{formatMoney(effectivePrice)}</strong>
                      {displayOriginalPrice ? <del>{formatMoney(displayOriginalPrice)}</del> : null}
                    </div>
                    {isOutOfStock ? <p className="stock-note out-stock">Out of stock</p> : null}
                    {isOutOfStock ? (
                      <button
                        type="button"
                        className="cart-button wishlist-action-button"
                        onClick={() => handleWishlistToggle(product._id)}
                        disabled={isUpdatingWishlist}
                      >
                        <Heart aria-hidden="true" />
                        <span>{isWishlisted ? "Wishlisted" : "Add to Wishlist"}</span>
                      </button>
                    ) : (
                      <AddToCartButton productId={product._id} stock={product.stock} className="cart-button" />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No featured products yet.</strong>
            <span>Mark products as featured in the backend to show them here.</span>
          </div>
        )}
      </div>
    </section>
  );
}
