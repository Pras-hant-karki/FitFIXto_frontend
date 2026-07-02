"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { CustomerDashboardShell } from "@/components/shared/customer";
import { useToast } from "@/contexts";
import { BackendOrder, BackendOrderItem, fetchMyOrders } from "@/features/orders";
import { BackendProduct, getProductImage } from "@/features/products";
import { BackendReview, createReview, fetchMyReviews } from "@/features/reviews";
import { BackendBooking, fetchMyClientBookings, submitTrainerReview } from "@/features/bookings";
import { BackendServiceBooking, fetchMyServiceBookings, submitServiceReview } from "@/features/serviceBookings";

type ReviewDraft = { rating: number; comment: string };

const defaultDraft = (): ReviewDraft => ({ rating: 0, comment: "" });

const formatOrderId = (id: string) => `ORD-${id.slice(-4).toUpperCase()}`;

const getProductFromOrderItem = (item: BackendOrderItem) => {
  if (typeof item.productId === "string") return null;
  return item.productId as BackendProduct;
};
const getProductIdFromOrderItem = (item: BackendOrderItem) => {
  if (typeof item.productId === "string") return item.productId;
  return (item.productId as BackendProduct)?._id || "";
};

const getTrainerName = (booking: BackendBooking): string => {
  if (typeof booking.trainerId === "string") return "Trainer";
  const t = booking.trainerId as { userId?: { firstName?: string; lastName?: string } };
  return `${t.userId?.firstName || ""} ${t.userId?.lastName || ""}`.trim() || "Trainer";
};

const getServiceName = (booking: BackendServiceBooking): string => {
  if (typeof booking.serviceId === "string") return "Service";
  return (booking.serviceId as { name?: string }).name || "Service";
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="customer-review-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          className={n <= value ? "active" : undefined}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
        >
          <Star aria-hidden="true" />
        </button>
      ))}
      <small>{value > 0 ? `${value} / 5` : "Tap to rate"}</small>
    </div>
  );
}

export default function UserToReviewPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [reviews, setReviews] = useState<BackendReview[]>([]);
  const [bookings, setBookings] = useState<BackendBooking[]>([]);
  const [serviceBookings, setServiceBookings] = useState<BackendServiceBooking[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [submitting, setSubmitting] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [nextOrders, nextReviews, nextBookings, nextServiceBookings] = await Promise.all([
          fetchMyOrders(),
          fetchMyReviews(),
          fetchMyClientBookings(),
          fetchMyServiceBookings(),
        ]);
        if (!isActive) return;
        setOrders(nextOrders);
        setReviews(nextReviews);
        setBookings(nextBookings);
        setServiceBookings(nextServiceBookings);
      } catch (err) {
        if (isActive) setError(err instanceof Error ? err.message : "Unable to load data.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    load();
    return () => { isActive = false; };
  }, []);

  const getDraft = (id: string) => drafts[id] ?? defaultDraft();
  const setDraft = (id: string, patch: Partial<ReviewDraft>) =>
    setDrafts((cur) => ({ ...cur, [id]: { ...getDraft(id), ...patch } }));

  // Product review items
  const productItems = useMemo(() => {
    const reviewedKeys = new Set(
      reviews.map((r) => {
        const prod = typeof r.productId === "string" ? r.productId : (r.productId as BackendProduct)?._id || "";
        return `${r.orderId}-${prod}`;
      })
    );
    return orders
      .filter((o) => o.status === "delivered")
      .flatMap((o) =>
        o.items.map((item) => {
          const product = getProductFromOrderItem(item);
          const productId = getProductIdFromOrderItem(item);
          const key = `${o._id}-${productId}`;
          return {
            key,
            orderId: o._id,
            orderCode: formatOrderId(o._id),
            productId,
            name: product?.name || item.productName,
            image: product ? getProductImage(product) : "",
            reviewed: reviewedKeys.has(key),
          };
        })
      )
      .filter((i) => i.productId && !i.reviewed);
  }, [orders, reviews]);

  // Completed trainer bookings not yet reviewed
  const unreviewedBookings = useMemo(
    () => bookings.filter((b) => b.status === "completed" && !b.clientRating),
    [bookings]
  );

  // Completed service bookings not yet reviewed
  const unreviewedServices = useMemo(
    () => serviceBookings.filter((b) => b.status === "completed" && !b.clientRating),
    [serviceBookings]
  );

  const hasAnything = productItems.length > 0 || unreviewedBookings.length > 0 || unreviewedServices.length > 0;

  // Past trainer reviews
  const reviewedBookings = useMemo(
    () => bookings.filter((b) => b.clientRating),
    [bookings]
  );
  const reviewedServices = useMemo(
    () => serviceBookings.filter((b) => b.clientRating),
    [serviceBookings]
  );

  const handleProductReview = async (item: (typeof productItems)[0]) => {
    const draft = getDraft(item.key);
    if (!draft.rating || !draft.comment.trim()) return;
    setSubmitting(item.key);
    try {
      const review = await createReview({ productId: item.productId, orderId: item.orderId, rating: draft.rating, comment: draft.comment.trim() });
      if (review) setReviews((cur) => [review, ...cur]);
      setDrafts((cur) => { const n = { ...cur }; delete n[item.key]; return n; });
      toast.success("Product review submitted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to submit review.");
    } finally {
      setSubmitting("");
    }
  };

  const handleTrainerReview = async (booking: BackendBooking) => {
    const draft = getDraft(booking._id);
    if (!draft.rating || !draft.comment.trim()) return;
    setSubmitting(booking._id);
    try {
      const updated = await submitTrainerReview(booking._id, draft.rating, draft.comment.trim());
      if (updated) setBookings((cur) => cur.map((b) => (b._id === updated._id ? updated : b)));
      setDrafts((cur) => { const n = { ...cur }; delete n[booking._id]; return n; });
      toast.success("Trainer review submitted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to submit review.");
    } finally {
      setSubmitting("");
    }
  };

  const handleServiceReview = async (booking: BackendServiceBooking) => {
    const draft = getDraft(booking._id);
    if (!draft.rating || !draft.comment.trim()) return;
    setSubmitting(booking._id);
    try {
      const updated = await submitServiceReview(booking._id, draft.rating, draft.comment.trim());
      if (updated) setServiceBookings((cur) => cur.map((b) => (b._id === updated._id ? updated : b)));
      setDrafts((cur) => { const n = { ...cur }; delete n[booking._id]; return n; });
      toast.success("Service review submitted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to submit review.");
    } finally {
      setSubmitting("");
    }
  };

  return (
    <CustomerDashboardShell>
      <section className="customer-review-panel">
        <header className="customer-review-heading">
          <h2>To Review</h2>
          <p>Share your experience with products, trainers, and services.</p>
        </header>

        {isLoading ? (
          <div className="customer-orders-empty">Loading...</div>
        ) : error ? (
          <div className="customer-orders-empty">{error}</div>
        ) : !hasAnything ? (
          <div className="customer-orders-empty">Nothing to review yet. Delivered orders and completed sessions will appear here.</div>
        ) : (
          <div className="customer-review-list">
            {/* Product reviews */}
            {productItems.map((item) => {
              const draft = getDraft(item.key);
              const canSubmit = draft.rating > 0 && draft.comment.trim().length > 0;
              return (
                <article className="customer-review-card" key={item.key}>
                  <div className="customer-review-product">
                    <div className="customer-review-image">
                      {item.image ? <img src={item.image} alt={item.name} /> : <span>No image</span>}
                    </div>
                    <div>
                      <span>Order #{item.orderCode} · Product</span>
                      <strong>{item.name}</strong>
                      <StarRating value={draft.rating} onChange={(v) => setDraft(item.key, { rating: v })} />
                    </div>
                  </div>
                  <textarea
                    value={draft.comment}
                    onChange={(e) => setDraft(item.key, { comment: e.target.value })}
                    placeholder="What did you like or dislike? How was the quality?"
                  />
                  <div className="customer-review-actions">
                    <button type="button" disabled={!canSubmit || submitting === item.key} onClick={() => handleProductReview(item)}>
                      {submitting === item.key ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </article>
              );
            })}

            {/* Trainer session reviews */}
            {unreviewedBookings.map((booking) => {
              const draft = getDraft(booking._id);
              const canSubmit = draft.rating > 0 && draft.comment.trim().length > 0;
              const trainerName = getTrainerName(booking);
              const sessionDate = new Date(booking.slotDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              return (
                <article className="customer-review-card" key={booking._id}>
                  <div className="customer-review-product">
                    <div className="customer-review-image" style={{ background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "var(--muted)" }}>
                      {trainerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span>{sessionDate} · Trainer Session</span>
                      <strong>{trainerName}</strong>
                      <StarRating value={draft.rating} onChange={(v) => setDraft(booking._id, { rating: v })} />
                    </div>
                  </div>
                  <textarea
                    value={draft.comment}
                    onChange={(e) => setDraft(booking._id, { comment: e.target.value })}
                    placeholder="How was your session? Was the trainer helpful and professional?"
                  />
                  <div className="customer-review-actions">
                    <button type="button" disabled={!canSubmit || submitting === booking._id} onClick={() => handleTrainerReview(booking)}>
                      {submitting === booking._id ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </article>
              );
            })}

            {/* Service reviews */}
            {unreviewedServices.map((booking) => {
              const draft = getDraft(booking._id);
              const canSubmit = draft.rating > 0 && draft.comment.trim().length > 0;
              const serviceName = getServiceName(booking);
              const scheduledDate = new Date(booking.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              return (
                <article className="customer-review-card" key={booking._id}>
                  <div className="customer-review-product">
                    <div className="customer-review-image" style={{ background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "var(--muted)" }}>
                      {serviceName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span>{scheduledDate} · Service</span>
                      <strong>{serviceName}</strong>
                      <StarRating value={draft.rating} onChange={(v) => setDraft(booking._id, { rating: v })} />
                    </div>
                  </div>
                  <textarea
                    value={draft.comment}
                    onChange={(e) => setDraft(booking._id, { comment: e.target.value })}
                    placeholder="How was the service? Was everything as expected?"
                  />
                  <div className="customer-review-actions">
                    <button type="button" disabled={!canSubmit || submitting === booking._id} onClick={() => handleServiceReview(booking)}>
                      {submitting === booking._id ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Past reviews */}
        {(reviews.length > 0 || reviewedBookings.length > 0 || reviewedServices.length > 0) ? (
          <section className="customer-past-reviews">
            <h3>Your past reviews</h3>
            <div className="customer-past-review-list">
              {/* Product reviews */}
              {reviews.map((review) => {
                const product = typeof review.productId === "string" ? null : review.productId as BackendProduct;
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
                        <span>{new Intl.DateTimeFormat("en-CA").format(new Date(review.createdAt))} · Product · Order #{formatOrderId(review.orderId)}</span>
                        {review.comment ? <p>{review.comment}</p> : null}
                      </div>
                    </div>
                    <div className="customer-past-review-stars">
                      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={n <= review.rating ? "active" : undefined} aria-hidden="true" />)}
                    </div>
                  </article>
                );
              })}

              {/* Trainer reviews */}
              {reviewedBookings.map((booking) => (
                <article className="customer-past-review-card" key={`booking-${booking._id}`}>
                  <div className="customer-past-review-product">
                    <div className="customer-past-review-image" style={{ background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "var(--muted)" }}>
                      {getTrainerName(booking).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>{getTrainerName(booking)}</strong>
                      <span>{new Date(booking.slotDate).toLocaleDateString("en-CA")} · Trainer Session</span>
                      {booking.clientComment ? <p>{booking.clientComment}</p> : null}
                    </div>
                  </div>
                  <div className="customer-past-review-stars">
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={n <= (booking.clientRating || 0) ? "active" : undefined} aria-hidden="true" />)}
                  </div>
                </article>
              ))}

              {/* Service reviews */}
              {reviewedServices.map((booking) => (
                <article className="customer-past-review-card" key={`service-${booking._id}`}>
                  <div className="customer-past-review-product">
                    <div className="customer-past-review-image" style={{ background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "var(--muted)" }}>
                      {getServiceName(booking).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>{getServiceName(booking)}</strong>
                      <span>{new Date(booking.scheduledDate).toLocaleDateString("en-CA")} · Service</span>
                      {booking.clientComment ? <p>{booking.clientComment}</p> : null}
                    </div>
                  </div>
                  <div className="customer-past-review-stars">
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={n <= (booking.clientRating || 0) ? "active" : undefined} aria-hidden="true" />)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </CustomerDashboardShell>
  );
}
