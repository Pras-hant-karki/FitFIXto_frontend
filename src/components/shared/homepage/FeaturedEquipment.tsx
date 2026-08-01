"use client";

import { useEffect, useState } from "react";
import {
  BackendProduct,
  fetchProducts,
  formatCategory,
  getOriginalPrice,
  getProductImage,
} from "@/features/products";
import { AddToCartButton } from "@/features/cart";

export function FeaturedEquipment() {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchProducts({ isFeatured: true, isActive: true, limit: 4 });
        setProducts(data?.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load featured equipment.");
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

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

              return (
                <article className="product-card" key={product._id}>
                  <div className="product-media">
                    {getProductImage(product) ? (
                      <img src={getProductImage(product)} alt={product.name} />
                    ) : (
                      <div className="product-no-image">No image</div>
                    )}
                    <div className="product-badges">
                      {product.verifiedBadge ? <span className="badge-dark">Verified</span> : null}
                      {discount > 0 ? <span className="badge-sale">-{discount}%</span> : null}
                    </div>
                    <button className="wishlist-button" type="button" aria-label={`Add ${product.name} to wishlist`}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="product-body">
                    <p>
                      {formatCategory(product.category)} - {product.brand || "FitFIXto"}
                    </p>
                    <h3>{product.name}</h3>
                    <div className="rating-line">
                      <span aria-hidden="true">&#9733;</span>
                      <strong>{product.averageRating.toFixed(1)}</strong>
                      <small>({product.ratingCount})</small>
                    </div>
                    <div className="price-line">
                      <strong>${product.price}</strong>
                      {originalPrice ? <del>${originalPrice}</del> : null}
                    </div>
                    <AddToCartButton productId={product._id} stock={product.stock} className="cart-button" />
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
