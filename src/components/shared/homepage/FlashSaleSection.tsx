"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Zap } from "lucide-react";
import { DiscountData, DiscountProduct, fetchPublicDiscounts } from "@/features/discounts";
import { AddToCartButton } from "@/features/cart";
import { resolveAssetUrl } from "@/constants/api";
import { useAuth, useWishlist } from "@/contexts";
import { formatCategory } from "@/features/products";

type Countdown = { days: number; hours: number; mins: number; secs: number };

const pad = (n: number) => String(n).padStart(2, "0");

const formatMoney = (value: number) => `Npr ${Math.round(value).toLocaleString()}`;

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flash-countdown-box">
      <strong>{pad(value)}</strong>
      <span>{label}</span>
    </div>
  );
}

export function FlashSaleSection() {
  const [discounts, setDiscounts] = useState<DiscountData | null>(null);
  const [countdown, setCountdown] = useState<Countdown>({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [updatingWishlistId, setUpdatingWishlistId] = useState("");
  const [justAddedWishlistId, setJustAddedWishlistId] = useState("");
  const { isAuthenticated } = useAuth();
  const { wishlistProductIds, toggleWishlistItem } = useWishlist();

  useEffect(() => {
    fetchPublicDiscounts().then(setDiscounts).catch(() => {});
  }, []);

  const flashSale = discounts?.flashSale;
  const isActive = Boolean(flashSale?.isActive);

  useEffect(() => {
    if (!flashSale?.endsAt) return;

    const update = () => {
      const diff = new Date(flashSale.endsAt!).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [flashSale?.endsAt]);

  const handleWishlistToggle = async (productId: string) => {
    if (!isAuthenticated) {
      window.location.href = `/login`;
      return;
    }
    const wasWishlisted = wishlistProductIds.has(productId);
    setUpdatingWishlistId(productId);
    try {
      await toggleWishlistItem(productId);
      if (!wasWishlisted) {
        setJustAddedWishlistId(productId);
        window.setTimeout(() => setJustAddedWishlistId(""), 300);
      }
    } finally {
      setUpdatingWishlistId("");
    }
  };

  if (!isActive || !flashSale) return null;

  const bestPriceIds = new Set((discounts?.bestPriceProductIds || []).map((p) => p._id));
  const discountPct = flashSale.discountPercentage;

  const flashProducts: DiscountProduct[] = (flashSale.productIds as DiscountProduct[]).filter(
    (p) => p && typeof p === "object" && p._id
  );

  if (flashProducts.length === 0) return null;

  return (
    <section className="home-section section-soft" id="flash-sale">
      <div className="section-inner">
        <div className="flash-sale-header">
          <div>
            <p className="flash-sale-eyebrow">
              <Zap aria-hidden="true" />
              {discountPct}% OFF
            </p>
            <h2 className="flash-sale-title">{flashSale.title}</h2>
          </div>
          {flashSale.endsAt ? (
            <div className="flash-countdown">
              <span className="flash-countdown-label">Ends In</span>
              <div className="flash-countdown-boxes">
                <CountdownBox value={countdown.days} label="Days" />
                <CountdownBox value={countdown.hours} label="Hrs" />
                <CountdownBox value={countdown.mins} label="Min" />
                <CountdownBox value={countdown.secs} label="Sec" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="product-grid">
          {flashProducts.map((product) => {
            const image = resolveAssetUrl(product.images?.[0]);
            const salePrice = Math.round(product.price * (1 - discountPct / 100));
            const isBestPrice = bestPriceIds.has(product._id);
            const isWishlisted = wishlistProductIds.has(product._id);
            const isUpdatingWishlist = updatingWishlistId === product._id;

            return (
              <article className="product-card" key={product._id}>
                <div className="product-media">
                  <Link href={`/products/${product._id}`} className="product-media-link">
                    {image ? <img src={image} alt={product.name} /> : <div className="product-no-image">No image</div>}
                  </Link>
                  <div className="product-badges">
                    <span className="badge-dark">Verified</span>
                    <span className="badge-dark badge-flash">
                      <Zap aria-hidden="true" />
                      Flash
                    </span>
                    {isBestPrice ? <span className="badge-best-price">Best Price</span> : null}
                    <span className="badge-sale-red">-{discountPct}%</span>
                  </div>
                  <button
                    className={`wishlist-button${isWishlisted ? " active" : ""}${justAddedWishlistId === product._id ? " just-added" : ""}`}
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
                  <p>{product.category ? formatCategory(product.category) : "Flash Sale"}</p>
                  <Link href={`/products/${product._id}`} className="product-title-link">
                    <h3>{product.name}</h3>
                  </Link>
                  <div className="price-line">
                    <strong>{formatMoney(salePrice)}</strong>
                    <del>{formatMoney(product.price)}</del>
                  </div>
                  <AddToCartButton productId={product._id} stock={99} className="cart-button" />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
