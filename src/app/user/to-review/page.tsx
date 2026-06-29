"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { CustomerDashboardShell } from "@/components/shared/customer";
import { BackendOrder, BackendOrderItem, fetchMyOrders } from "@/features/orders";
import { BackendProduct, getProductImage } from "@/features/products";
import { BackendReview, createReview, fetchMyReviews } from "@/features/reviews";

type ReviewDraft = {
  rating: number;
  comment: string;
};

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
    reviews.map((review) => {
      const product = getProductFromReview(review);
      const productId = product?._id || (typeof review.productId === "string" ? review.productId : "");
      return `${review.orderId}-${productId}`;
    })
  );

  return orders
    .filter((order) => order.status === "delivered")
    .flatMap((order) =>
      order.items.map((item) => {
        const product = getProductFromOrderItem(item);
        const productId = getProductIdFromOrderItem(item);

        return {
          id: `${order._id}-${productId}`,
          orderId: order._id,
          orderCode: formatOrderId(order._id),
          productId,
          productName: product?.name || item.productName,
          productImage: product ? getProductImage(product) : "",
        };
      })
    )
    .filter((item) => item.productId && !reviewedKeys.has(`${item.orderId}-${item.productId}`));
};

export default function UserToReviewPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [reviews, setReviews] = useState<BackendReview[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [submittingItemId, setSubmittingItemId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadOrders = async () => {
      setIsLoading(true);
      setError("");
      setMessage("");

      try {
        const [nextOrders, nextReviews] = await Promise.all([fetchMyOrders(), fetchMyReviews()]);
        if (isActive) {
          setOrders(nextOrders);
          setReviews(nextReviews);
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

  const reviewItems = useMemo(() => toReviewableItems(orders, reviews), [orders, reviews]);

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

  const handleSubmitReview = async (item: ReviewableItem) => {
    const draft = drafts[item.id] || { rating: 0, comment: "" };
    const comment = draft.comment.trim();

    if (!draft.rating || !comment) return;

    setSubmittingItemId(item.id);
    setError("");
    setMessage("");

    try {
      const review = await createReview({
        productId: item.productId,
        orderId: item.orderId,
        rating: draft.rating,
        comment,
      });

      if (review) {
        setReviews((current) => [review, ...current]);
      }

      setDrafts((current) => {
        const nextDrafts = { ...current };
        delete nextDrafts[item.id];
        return nextDrafts;
      });
      setMessage("Review submitted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit review.");
    } finally {
      setSubmittingItemId("");
    }
  };

  return (
    <CustomerDashboardShell>
      <section className="customer-review-panel">
        <header className="customer-review-heading">
          <h2>To Review</h2>
          <p>Share your experience for products you received.</p>
        </header>

        {message ? <p className="customer-review-message">{message}</p> : null}

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
                    <button type="button" disabled={!canSubmit || submittingItemId === item.id} onClick={() => handleSubmitReview(item)}>
                      {submittingItemId === item.id ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {reviews.length ? (
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
                        <span>
                          {new Intl.DateTimeFormat("en-CA").format(new Date(review.createdAt))} - Order #{formatOrderId(review.orderId)}
                        </span>
                        {review.comment ? <p>{review.comment}</p> : null}
                      </div>
                    </div>
                    <div className="customer-past-review-stars" aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star className={rating <= review.rating ? "active" : undefined} aria-hidden="true" key={rating} />
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </section>
    </CustomerDashboardShell>
  );
}
