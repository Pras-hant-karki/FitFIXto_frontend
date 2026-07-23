"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Search, Star, Trash2 } from "lucide-react";
import { BackendReview, ReviewListResponse, featureReview, fetchAdminReviews, moderateReview } from "@/features/reviews";
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

const REVIEWS_PER_PAGE = 20;

const DEFAULT_PAGINATION = {
  total: 0,
  page: 1,
  limit: REVIEWS_PER_PAGE,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
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
  const [reviewsPagination, setReviewsPagination] = useState(DEFAULT_PAGINATION);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [trainerBookings, setTrainerBookings] = useState<BackendBooking[]>([]);
  const [serviceBookings, setServiceBookings] = useState<BackendServiceBooking[]>([]);
  const [selectedTab, setSelectedTab] = useState<ReviewTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingReviewId, setUpdatingReviewId] = useState("");
  const [featuringReviewId, setFeaturingReviewId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProductReviews = useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAdminReviews({ status: "all", page, limit: REVIEWS_PER_PAGE, ...(search.trim() ? { search: search.trim() } : {}) });
      setReviews(data?.reviews || []);
      setReviewsPagination(data?.pagination || DEFAULT_PAGINATION);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reviews.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBookingReviews = useCallback(async () => {
    try {
      const [bookingsResult, svcResult] = await Promise.all([
        fetchAdminBookings({ limit: 200 }),
        fetchAllServiceBookings({ limit: 200 }),
      ]);
      setTrainerBookings(bookingsResult.bookings.filter((b) => b.clientRating));
      setServiceBookings(svcResult.bookings.filter((b) => b.clientRating));
    } catch {
      // secondary data — do not surface error
    }
  }, []);

  useEffect(() => {
    loadProductReviews(1, "");
    loadBookingReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tab: ReviewTab) => {
    setSelectedTab(tab);
    setReviewsPage(1);
    loadProductReviews(1, searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setReviewsPage(1);
      loadProductReviews(1, query);
    }, 350);
  };

  const handleReviewsPageChange = (newPage: number) => {
    setReviewsPage(newPage);
    loadProductReviews(newPage, searchQuery);
  };

  const visibleReviews = selectedTab === "all" || selectedTab === "product" ? reviews : [];
  const visibleTrainerBookings =
    (selectedTab === "all" || selectedTab === "trainer") ? trainerBookings : [];
  const visibleServiceBookings =
    (selectedTab === "all" || selectedTab === "service") ? serviceBookings : [];

  const totalCount = visibleReviews.length + visibleTrainerBookings.length + visibleServiceBookings.length;

  const tabCounts = {
    all: reviewsPagination.total + trainerBookings.length + serviceBookings.length,
    product: reviewsPagination.total,
    trainer: trainerBookings.length,
    service: serviceBookings.length,
  };

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

  const showProductPagination =
    (selectedTab === "all" || selectedTab === "product") && reviewsPagination.totalPages > 1;

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
              onClick={() => handleTabChange(tab.key)}
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
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </form>
      </div>

      {message ? <p className="admin-products-message success">{message}</p> : null}
      {error ? <p className="admin-products-message error">{error}</p> : null}

      <div className="admin-reviews-list">
        {isLoading ? (
          <div className="admin-reviews-empty" style={{ textAlign: "left" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: 16, padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
                <div className="skeleton skeleton-avatar" style={{ width: 36, height: 36 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="skeleton skeleton-text wide" />
                  <div className="skeleton skeleton-text mid" />
                </div>
                <div className="skeleton skeleton-text" style={{ width: 80 }} />
              </div>
            ))}
          </div>
        ) : totalCount === 0 && !isLoading ? (
          <div className="admin-reviews-empty">No reviews found.</div>
        ) : (
          <>
            {/* Product reviews */}
            {visibleReviews.map((review) => {
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
            {visibleTrainerBookings.map((booking) => (
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
            {visibleServiceBookings.map((booking) => (
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

      {showProductPagination ? (
        <div className="admin-pagination">
          <button
            type="button"
            disabled={!reviewsPagination.hasPrevPage}
            onClick={() => handleReviewsPageChange(reviewsPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <span>
            Page {reviewsPagination.page} of {reviewsPagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!reviewsPagination.hasNextPage}
            onClick={() => handleReviewsPageChange(reviewsPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
