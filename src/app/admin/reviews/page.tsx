"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search, Star, Trash2 } from "lucide-react";
import { BackendReview, featureReview, fetchAdminReviews, moderateReview } from "@/features/reviews";
import { BackendProduct, getProductImage } from "@/features/products";
import { BackendBooking, fetchAdminBookings } from "@/features/bookings";
import { BackendServiceBooking, fetchAllServiceBookings } from "@/features/serviceBookings";

type ReviewTab = "all" | "product" | "trainer" | "service";

type ReviewUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

type ReviewOrder = {
  orderNumber?: string;
  status?: string;
  createdAt?: string;
};

const tabs: Array<{ key: ReviewTab; label: string }> = [
  { key: "all", label: "All" },
  { key: "product", label: "Products" },
  { key: "trainer", label: "Trainers" },
  { key: "service", label: "Services" },
];

const getProduct = (review: BackendReview) =>
  typeof review.productId === "string" ? null : (review.productId as BackendProduct);

const getUser = (review: BackendReview) =>
  typeof review.userId === "string" ? null : (review.userId as ReviewUser);

const getOrder = (review: BackendReview) =>
  typeof review.orderId === "string" ? null : (review.orderId as unknown as ReviewOrder);

const getReviewerName = (review: BackendReview) => {
  const user = getUser(review);
  if (!user) return "Customer";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Customer";
};

const getReviewStatus = (review: BackendReview) =>
  review.isActive && review.moderationStatus !== "removed" ? "approved" : "removed";

const formatDate = (value?: string) => {
  if (!value) return "Unknown date";
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
};

const getTrainerName = (booking: BackendBooking): string => {
  if (typeof booking.trainerId === "string") return "Trainer";
  const t = booking.trainerId as { userId?: { firstName?: string; lastName?: string } };
  return `${t.userId?.firstName || ""} ${t.userId?.lastName || ""}`.trim() || "Trainer";
};

const getClientName = (booking: BackendBooking | BackendServiceBooking): string => {
  const c = booking.clientId;
  if (typeof c === "string") return "Client";
  return `${(c as { firstName?: string }).firstName || ""} ${(c as { lastName?: string }).lastName || ""}`.trim() || "Client";
};

const getServiceName = (booking: BackendServiceBooking): string => {
  if (typeof booking.serviceId === "string") return "Service";
  return (booking.serviceId as { name?: string }).name || "Service";
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="admin-review-rating">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={i < rating ? "active" : undefined} aria-hidden="true" />
      ))}
      <span>{rating}/5</span>
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<BackendReview[]>([]);
  const [trainerBookings, setTrainerBookings] = useState<BackendBooking[]>([]);
  const [serviceBookings, setServiceBookings] = useState<BackendServiceBooking[]>([]);
  const [selectedTab, setSelectedTab] = useState<ReviewTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingReviewId, setUpdatingReviewId] = useState("");
  const [featuringReviewId, setFeaturingReviewId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAll = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [reviewsData, bookingsData, serviceData] = await Promise.all([
        fetchAdminReviews({ status: "all", limit: 100 }),
        fetchAdminBookings(),
        fetchAllServiceBookings(),
      ]);
      setReviews(reviewsData?.reviews || []);
      setTrainerBookings(bookingsData.filter((b) => b.clientRating));
      setServiceBookings(serviceData.filter((b) => b.clientRating));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = reviews;
    if (selectedTab === "product") list = reviews;
    else if (selectedTab !== "all") return [];
    if (!q) return list;
    return list.filter((r) => {
      const prod = getProduct(r);
      const user = getUser(r);
      return (
        prod?.name?.toLowerCase().includes(q) ||
        user?.email?.toLowerCase().includes(q) ||
        getReviewerName(r).toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q)
      );
    });
  }, [reviews, selectedTab, searchQuery]);

  const filteredTrainerBookings = useMemo(() => {
    if (selectedTab !== "all" && selectedTab !== "trainer") return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return trainerBookings;
    return trainerBookings.filter((b) =>
      getTrainerName(b).toLowerCase().includes(q) ||
      getClientName(b).toLowerCase().includes(q) ||
      b.clientComment?.toLowerCase().includes(q)
    );
  }, [trainerBookings, selectedTab, searchQuery]);

  const filteredServiceBookings = useMemo(() => {
    if (selectedTab !== "all" && selectedTab !== "service") return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return serviceBookings;
    return serviceBookings.filter((b) =>
      getServiceName(b).toLowerCase().includes(q) ||
      getClientName(b).toLowerCase().includes(q) ||
      b.clientComment?.toLowerCase().includes(q)
    );
  }, [serviceBookings, selectedTab, searchQuery]);

  const totalCount = filteredReviews.length + filteredTrainerBookings.length + filteredServiceBookings.length;

  const tabCounts = useMemo(() => ({
    all: reviews.length + trainerBookings.length + serviceBookings.length,
    product: reviews.length,
    trainer: trainerBookings.length,
    service: serviceBookings.length,
  }), [reviews, trainerBookings, serviceBookings]);

  const handleModeration = async (review: BackendReview, status: "approved" | "removed") => {
    setMessage("");
    setError("");
    setUpdatingReviewId(review._id);
    try {
      const updatedReview = await moderateReview(review._id, status);
      if (updatedReview) {
        setReviews((current) => current.map((item) => (item._id === updatedReview._id ? updatedReview : item)));
      }
      setMessage(status === "approved" ? "Review approved." : "Review removed from public product ratings.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to moderate review.");
    } finally {
      setUpdatingReviewId("");
    }
  };

  const handleFeature = async (review: BackendReview) => {
    setMessage("");
    setError("");
    setFeaturingReviewId(review._id);
    const next = !review.isFeatured;
    try {
      const updated = await featureReview(review._id, next);
      if (updated) {
        setReviews((current) => current.map((r) => (r._id === updated._id ? updated : r)));
      }
      setMessage(next ? "Review featured on homepage." : "Review removed from homepage.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update feature status.");
    } finally {
      setFeaturingReviewId("");
    }
  };

  return (
    <section className="admin-reviews-page">
      <header className="admin-reviews-header">
        <div>
          <h1>Reviews</h1>
          <p>All customer feedback — products, trainer sessions, and services.</p>
        </div>
      </header>

      <div className="admin-review-toolbar">
        <div className="admin-review-tabs" role="tablist" aria-label="Review type filters">
          {tabs.map((tab) => (
            <button
              type="button"
              className={selectedTab === tab.key ? "active" : undefined}
              onClick={() => setSelectedTab(tab.key)}
              key={tab.key}
            >
              {tab.label}
              <span>{tabCounts[tab.key]}</span>
            </button>
          ))}
        </div>

        <form className="admin-review-search" onSubmit={(e) => e.preventDefault()}>
          <Search aria-hidden="true" />
          <input
            type="search"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {message ? <p className="admin-products-message success">{message}</p> : null}
      {error ? <p className="admin-products-message error">{error}</p> : null}

      <div className="admin-reviews-list">
        {isLoading ? (
          <div className="admin-reviews-empty">Loading reviews...</div>
        ) : totalCount === 0 ? (
          <div className="admin-reviews-empty">No reviews found.</div>
        ) : (
          <>
            {/* Product reviews */}
            {filteredReviews.map((review) => {
              const product = getProduct(review);
              const user = getUser(review);
              const order = getOrder(review);
              const status = getReviewStatus(review);
              const image = product ? getProductImage(product) : "";

              return (
                <article className="admin-review-card" key={`prod-${review._id}`}>
                  <div className="admin-review-product">
                    {image ? <img src={image} alt="" /> : <span>No image</span>}
                    <div>
                      <strong>{product?.name || "Product"}</strong>
                      <small>
                        {product?.brand || "FitFIXto"}{product?.category ? ` - ${product.category.replace(/_/g, " ")}` : ""}
                        {" · "}
                        <span className="admin-review-type-badge">Product</span>
                      </small>
                    </div>
                  </div>

                  <div className="admin-review-body">
                    <div className="admin-review-meta">
                      <strong>{getReviewerName(review)}</strong>
                      <span>{user?.email || "No email"}</span>
                      <span>{order?.orderNumber || "Order"} - {formatDate(order?.createdAt || review.createdAt)}</span>
                    </div>
                    <StarDisplay rating={review.rating} />
                    {review.title ? <h2>{review.title}</h2> : null}
                    <p>{review.comment || "No written comment."}</p>
                  </div>

                  <div className="admin-review-actions">
                    <span className={`admin-review-status ${status}`}>{status}</span>
                    <button
                      type="button"
                      className={review.isFeatured ? "admin-review-feature-btn featured" : "admin-review-feature-btn"}
                      disabled={featuringReviewId === review._id}
                      onClick={() => handleFeature(review)}
                    >
                      <Star aria-hidden="true" className={review.isFeatured ? "filled" : undefined} />
                      {review.isFeatured ? "Featured" : "Feature"}
                    </button>
                    <button
                      type="button"
                      disabled={updatingReviewId === review._id || status === "approved"}
                      onClick={() => handleModeration(review, "approved")}
                    >
                      <Check aria-hidden="true" />
                      Approve
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={updatingReviewId === review._id || status === "removed"}
                      onClick={() => handleModeration(review, "removed")}
                    >
                      <Trash2 aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}

            {/* Trainer session reviews */}
            {filteredTrainerBookings.map((booking) => (
              <article className="admin-review-card" key={`trainer-${booking._id}`}>
                <div className="admin-review-product">
                  <div style={{ width: 52, height: 52, borderRadius: 8, background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "var(--muted)", flexShrink: 0 }}>
                    {getTrainerName(booking).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>{getTrainerName(booking)}</strong>
                    <small>
                      Trainer Session · <span className="admin-review-type-badge">Trainer</span>
                    </small>
                  </div>
                </div>

                <div className="admin-review-body">
                  <div className="admin-review-meta">
                    <strong>{getClientName(booking)}</strong>
                    <span>{formatDate(booking.slotDate)} · {booking.timeLabel}</span>
                  </div>
                  <StarDisplay rating={booking.clientRating || 0} />
                  <p>{booking.clientComment || "No written comment."}</p>
                </div>

                <div className="admin-review-actions">
                  <span className="admin-review-status approved">submitted</span>
                </div>
              </article>
            ))}

            {/* Service reviews */}
            {filteredServiceBookings.map((booking) => (
              <article className="admin-review-card" key={`service-${booking._id}`}>
                <div className="admin-review-product">
                  <div style={{ width: 52, height: 52, borderRadius: 8, background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "var(--muted)", flexShrink: 0 }}>
                    {getServiceName(booking).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>{getServiceName(booking)}</strong>
                    <small>
                      Service · <span className="admin-review-type-badge">Service</span>
                    </small>
                  </div>
                </div>

                <div className="admin-review-body">
                  <div className="admin-review-meta">
                    <strong>{getClientName(booking)}</strong>
                    <span>{formatDate(booking.scheduledDate)}</span>
                  </div>
                  <StarDisplay rating={booking.clientRating || 0} />
                  <p>{booking.clientComment || "No written comment."}</p>
                </div>

                <div className="admin-review-actions">
                  <span className="admin-review-status approved">submitted</span>
                </div>
              </article>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
