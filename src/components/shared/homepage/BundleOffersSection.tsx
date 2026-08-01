"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Bundle, DiscountData, fetchPublicDiscounts } from "@/features/discounts";
import { resolveAssetUrl } from "@/constants/api";
import { useAuth, useCart, useToast } from "@/contexts";

const formatMoney = (value: number) => `Npr ${Math.round(value).toLocaleString()}`;

export function BundleOffersSection() {
  const [discounts, setDiscounts] = useState<DiscountData | null>(null);
  const [addingBundleId, setAddingBundleId] = useState("");
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    fetchPublicDiscounts().then(setDiscounts).catch(() => {});
  }, []);

  const activeBundles = (discounts?.bundles || []).filter((b) => b.isActive);

  if (activeBundles.length === 0) return null;

  const handleAddBundle = async (bundle: Bundle) => {
    if (!isAuthenticated) {
      window.location.href = `/login`;
      return;
    }

    setAddingBundleId(bundle._id);
    try {
      for (const product of bundle.productIds) {
        await addToCart(product._id, 1);
      }
      toast.success(`${bundle.title} added to cart!`);
    } catch {
      toast.error("Unable to add bundle to cart.");
    } finally {
      setAddingBundleId("");
    }
  };

  return (
    <section className="home-section bundle-offers-section" id="bundles">
      <div className="section-inner">
        <div className="section-heading compact">
          <p>Save More</p>
          <h2>Bundle Offers</h2>
          <span>Buy together and the discount applies automatically at checkout.</span>
        </div>

        <div className="bundle-offer-grid">
          {activeBundles.map((bundle) => {
            const image = resolveAssetUrl(bundle.image);
            const originalTotal = bundle.productIds.reduce((sum, p) => sum + p.price, 0);
            const bundlePrice = Math.round(originalTotal * (1 - bundle.discountPercentage / 100));
            const savings = Math.round(originalTotal - bundlePrice);
            const isAdding = addingBundleId === bundle._id;

            return (
              <article className="bundle-offer-card" key={bundle._id}>
                {image ? <img src={image} alt={bundle.title} className="bundle-offer-img" /> : null}
                <div className="bundle-offer-body">
                  <span className="bundle-offer-badge">
                    <Package aria-hidden="true" />
                    Bundle · -{bundle.discountPercentage}%
                  </span>
                  <h3>{bundle.title}</h3>
                  {bundle.description ? <p className="bundle-offer-desc">{bundle.description}</p> : null}
                  <p className="bundle-offer-products">
                    {bundle.productIds.map((p) => p.name).join(" + ")}
                  </p>
                  <div className="bundle-offer-pricing">
                    <strong>{formatMoney(bundlePrice)}</strong>
                    <del>{formatMoney(originalTotal)}</del>
                    <span className="bundle-offer-save">Save {formatMoney(savings)}</span>
                  </div>
                  <button
                    type="button"
                    className="bundle-offer-btn"
                    onClick={() => handleAddBundle(bundle)}
                    disabled={isAdding}
                  >
                    {isAdding ? "Adding..." : "Add Bundle"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
