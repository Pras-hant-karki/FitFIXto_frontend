"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { CustomerDashboardShell } from "@/components/shared/customer";
import { BackendOrder, BackendOrderItem, fetchMyOrders } from "@/features/orders";
import { BackendProduct, getProductImage } from "@/features/products";

type ReviewDraft = {
  rating: number;
  comment: string;
};

type ReviewableItem = {
  id: string;
  orderId: string;
  orderCode: string;
  productName: string;
  productImage: string;
};

const formatOrderId = (id: string) => `ORD-${id.slice(-4).toUpperCase()}`;

const getProductFromOrderItem = (item: BackendOrderItem) => {
  if (typeof item.productId === "string") return null;
  return item.productId as BackendProduct;
};

const toReviewableItems = (orders: BackendOrder[]) =>
  orders
    .filter((order) => order.status === "delivered")
    .flatMap((order) =>
      order.items.map((item) => {
        const product = getProductFromOrderItem(item);
        const productId = product?._id || `${order._id}-${item.productName}`;

        return {
          id: `${order._id}-${productId}`,
          orderId: order._id,
          orderCode: formatOrderId(order._id),
          productName: product?.name || item.productName,
          productImage: product ? getProductImage(product) : "",
        };
      })
    );

export default function UserToReviewPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadOrders = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextOrders = await fetchMyOrders();
        if (isActive) {
          setOrders(nextOrders);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Unable to load products for review.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isActive = false;
    };
  }, []);

  const reviewItems = useMemo(() => toReviewableItems(orders), [orders]);

  const updateDraft = (itemId: string, nextDraft: Partial<ReviewDraft>) => {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        rating: current[itemId]?.rating || 0,
        comment: current[itemId]?.comment || "",
        ...nextDraft,
      },
    }));
  };

  return (
    <CustomerDashboardShell>
      <section className="customer-review-panel">
        <header className="customer-review-heading">
          <h2>To Review</h2>
          <p>Share your experience for products you received.</p>
        </header>

        {isLoading ? (
          <div className="customer-orders-empty">Loading products to review...</div>
        ) : error ? (
          <div className="customer-orders-empty">{error}</div>
        ) : reviewItems.length === 0 ? (
          <div className="customer-orders-empty">No products to review yet. Delivered order items will appear here.</div>
        ) : (
          <div className="customer-review-list">
            {reviewItems.map((item) => {
              const draft = drafts[item.id] || { rating: 0, comment: "" };
              const canSubmit = draft.rating > 0 && draft.comment.trim().length > 0;

              return (
                <article className="customer-review-card" key={item.id}>
                  <div className="customer-review-product">
                    <div className="customer-review-image">
                      {item.productImage ? <img src={item.productImage} alt={item.productName} /> : <span>No image</span>}
                    </div>
                    <div>
                      <span>Order #{item.orderCode}</span>
                      <strong>{item.productName}</strong>
                      <div className="customer-review-stars" aria-label={`Rate ${item.productName}`}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            type="button"
                            className={rating <= draft.rating ? "active" : undefined}
                            onClick={() => updateDraft(item.id, { rating })}
                            aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                            key={rating}
                          >
                            <Star aria-hidden="true" />
                          </button>
                        ))}
                        <small>{draft.rating > 0 ? `${draft.rating} / 5` : "Tap to rate"}</small>
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={draft.comment}
                    onChange={(event) => updateDraft(item.id, { comment: event.target.value })}
                    placeholder="What did you like or dislike? How was the quality?"
                  />

                  <div className="customer-review-actions">
                    <button type="button" disabled={!canSubmit} title="Review submission will be connected in the next review task.">
                      Submit Review
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </CustomerDashboardShell>
  );
}
