"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import { BackendOrder, BackendOrderItem, fetchMyOrders } from "@/features/orders";
import { BackendProduct, getProductImage } from "@/features/products";
import { BackendReview, createReview, fetchMyReviews } from "@/features/reviews";

type ReviewDraft = { rating: number; comment: string };

type ReviewableItem = {
  id: string;
  orderId: string;
  orderCode: string;
  productId: string;
  productName: string;
  productImage: string;
};

const formatOrderId = (id: string) => `ORD-${id.slice(-4).toUpperCase()}`;

const getProductFromOrderItem = (item: BackendOrderItem) => {
  if (typeof item.productId === "string") return null;
  return item.productId as BackendProduct;
};

const getProductIdFromOrderItem = (item: BackendOrderItem) => {
  if (typeof item.productId === "string") return item.productId;
  return item.productId?._id || "";
};

const getProductFromReview = (review: BackendReview) => {
  if (typeof review.productId === "string") return null;
  return review.productId as BackendProduct;
};

const toReviewableItems = (orders: BackendOrder[], reviews: BackendReview[]) => {
  const reviewedKeys = new Set(
    reviews.map((r) => {
      const p = getProductFromReview(r);
      const pid = p?._id || (typeof r.productId === "string" ? r.productId : "");
      return `${r.orderId}-${pid}`;
    })
  );
  return orders
    .filter((o) => o.status === "delivered")
    .flatMap((o) =>
      o.items.map((item) => {
        const product = getProductFromOrderItem(item);
        const productId = getProductIdFromOrderItem(item);
        return {
          id: `${o._id}-${productId}`,
          orderId: o._id,
          orderCode: formatOrderId(o._id),
          productId,
          productName: product?.name || item.productName,
          productImage: product ? getProductImage(product) : "",
        };
      })
    )
    .filter((item) => item.productId && !reviewedKeys.has(`${item.orderId}-${item.productId}`));
};

export default function TrainerToReviewPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [reviews, setReviews] = useState<BackendReview[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [submittingItemId, setSubmittingItemId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const [nextOrders, nextReviews] = await Promise.all([fetchMyOrders(), fetchMyReviews()]);
        if (isActive) { setOrders(nextOrders); setReviews(nextReviews); }
      } catch (err) {
        if (isActive) setError(err instanceof Error ? err.message : "Unable to load products for review.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    load();
    return () => { isActive = false; };
  }, []);

  const reviewItems = useMemo(() => toReviewableItems(orders, reviews), [orders, reviews]);

  const updateDraft = (itemId: string, next: Partial<ReviewDraft>) =>
    setDrafts((cur) => ({ ...cur, [itemId]: { rating: cur[itemId]?.rating || 0, comment: cur[itemId]?.comment || "", ...next } }));

  const handleSubmitReview = async (item: ReviewableItem) => {
    const draft = drafts[item.id] || { rating: 0, comment: "" };
    if (!draft.rating || !draft.comment.trim()) return;
    setSubmittingItemId(item.id);
    setError(""); setMessage("");
    try {
      const review = await createReview({ productId: item.productId, orderId: item.orderId, rating: draft.rating, comment: draft.comment.trim() });
      if (review) setReviews((cur) => [review, ...cur]);
      setDrafts((cur) => { const n = { ...cur }; delete n[item.id]; return n; });
      setMessage("Review submitted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit review.");
    } finally {
      setSubmittingItemId("");
    }
  };

  return (
    <TrainerDashboardShell>
      <section className="customer-review-panel">
        <header className="customer-review-heading">
          <h2>To Review</h2>
          <p>Share your experience for products you received.</p>
        </header>
        {message ? <p className="customer-review-message">{message}</p> : null}
        {isLoading ? (
          <div className="customer-orders-empty">
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: i < 2 ? "1px solid var(--line)" : undefined }}>
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                  <div className="skeleton skeleton-text wide" />
                  <div className="skeleton skeleton-text mid" />
                  <div className="skeleton skeleton-text short" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="customer-orders-empty">{error}</div>
        ) : reviewItems.length === 0 ? (
          <div className="customer-orders-empty">No products to review yet. Delivered order items appear here.</div>
        ) : (
          <div className="customer-review-list">
            {reviewItems.map((item) => {
              const draft = drafts[item.id] || { rating: 0, comment: "" };
              return (
                <article className="customer-review-card" key={item.id}>
                  <div className="customer-review-product">
                    <div className="customer-review-image">
                      {item.productImage ? <img src={item.productImage} alt={item.productName} /> : <span>No image</span>}
                    </div>
                    <div>
                      <span>Order #{item.orderCode}</span>
                      <strong>{item.productName}</strong>
                      <div className="customer-review-stars">
                        {[1,2,3,4,5].map((r) => (
                          <button type="button" className={r <= draft.rating ? "active" : undefined} onClick={() => updateDraft(item.id, { rating: r })} aria-label={`${r} star${r===1?"":"s"}`} key={r}>
                            <Star aria-hidden="true" />
                          </button>
                        ))}
                        <small>{draft.rating > 0 ? `${draft.rating} / 5` : "Tap to rate"}</small>
                      </div>
                    </div>
                  </div>
                  <textarea value={draft.comment} onChange={(e) => updateDraft(item.id, { comment: e.target.value })} placeholder="What did you like or dislike? How was the quality?" />
                  <div className="customer-review-actions">
                    <button type="button" disabled={!draft.rating || !draft.comment.trim() || submittingItemId === item.id} onClick={() => handleSubmitReview(item)}>
                      {submittingItemId === item.id ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {reviews.length > 0 ? (
          <section className="customer-past-reviews">
            <h3>Your past reviews</h3>
            <div className="customer-past-review-list">
              {reviews.map((review) => {
                const product = getProductFromReview(review);
                const productName = product?.name || "Reviewed product";
                const productImage = product ? getProductImage(product) : "";
                return (
                  <article className="customer-past-review-card" key={review._id}>
                    <div className="customer-past-review-product">
                      <div className="customer-past-review-image">
                        {productImage ? <img src={productImage} alt={productName} /> : <span>No image</span>}
                      </div>
                      <div>
                        <strong>{productName}</strong>
                        <span>{new Intl.DateTimeFormat("en-CA").format(new Date(review.createdAt))} - Order #{formatOrderId(review.orderId)}</span>
                        {review.comment ? <p>{review.comment}</p> : null}
                      </div>
                    </div>
                    <div className="customer-past-review-stars">
                      {[1,2,3,4,5].map((r) => <Star className={r <= review.rating ? "active" : undefined} aria-hidden="true" key={r} />)}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </section>
    </TrainerDashboardShell>
  );
}
