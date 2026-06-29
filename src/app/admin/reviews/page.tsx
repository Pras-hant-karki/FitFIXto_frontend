"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search, Star, Trash2 } from "lucide-react";
import { BackendReview, fetchAdminReviews, moderateReview } from "@/features/reviews";
import { BackendProduct, getProductImage } from "@/features/products";

type ReviewTab = "all" | "approved" | "removed";

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
  { key: "approved", label: "Approved" },
  { key: "removed", label: "Removed" },
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

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<BackendReview[]>([]);
  const [selectedTab, setSelectedTab] = useState<ReviewTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingReviewId, setUpdatingReviewId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadReviews = async (status = selectedTab) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchAdminReviews({
        status,
        limit: 100,
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      });
      setReviews(response?.reviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(selectedTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  const tabCounts = useMemo(
    () => ({
      all: reviews.length,
      approved: reviews.filter((review) => getReviewStatus(review) === "approved").length,
      removed: reviews.filter((review) => getReviewStatus(review) === "removed").length,
    }),
    [reviews]
  );

  const handleModeration = async (review: BackendReview, status: "approved" | "removed") => {
    setMessage("");
    setError("");
    setUpdatingReviewId(review._id);

    try {
      const updatedReview = await moderateReview(review._id, status);

      if (updatedReview) {
        setReviews((current) =>
          current
            .map((item) => (item._id === updatedReview._id ? updatedReview : item))
            .filter((item) => selectedTab === "all" || getReviewStatus(item) === selectedTab)
        );
      }

      setMessage(status === "approved" ? "Review approved." : "Review removed from public product ratings.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to moderate review.");
    } finally {
      setUpdatingReviewId("");
    }
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadReviews(selectedTab);
  };

  return (
    <section className="admin-reviews-page">
      <header className="admin-reviews-header">
        <div>
          <h1>Reviews</h1>
          <p>Approve real product feedback and remove suspicious reviews.</p>
        </div>
      </header>

      <div className="admin-review-toolbar">
        <div className="admin-review-tabs" role="tablist" aria-label="Review status filters">
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

        <form className="admin-review-search" onSubmit={handleSearch}>
          <Search aria-hidden="true" />
          <input
            type="search"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>
      </div>

      {message ? <p className="admin-products-message success">{message}</p> : null}
      {error ? <p className="admin-products-message error">{error}</p> : null}

      <div className="admin-reviews-list">
        {isLoading ? (
          <div className="admin-reviews-empty">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="admin-reviews-empty">No reviews found.</div>
        ) : (
          reviews.map((review) => {
            const product = getProduct(review);
            const user = getUser(review);
            const order = getOrder(review);
            const status = getReviewStatus(review);
            const image = product ? getProductImage(product) : "";

            return (
              <article className="admin-review-card" key={review._id}>
                <div className="admin-review-product">
                  {image ? <img src={image} alt="" /> : <span>No image</span>}
                  <div>
                    <strong>{product?.name || "Product"}</strong>
                    <small>
                      {product?.brand || "FitFIXto"} {product?.category ? `- ${product.category.replace(/_/g, " ")}` : ""}
                    </small>
                  </div>
                </div>

                <div className="admin-review-body">
                  <div className="admin-review-meta">
                    <strong>{getReviewerName(review)}</strong>
                    <span>{user?.email || "No email"}</span>
                    <span>{order?.orderNumber || "Order"} - {formatDate(order?.createdAt || review.createdAt)}</span>
                  </div>
                  <div className="admin-review-rating" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star className={index < review.rating ? "active" : undefined} aria-hidden="true" key={index} />
                    ))}
                    <span>{review.rating}/5</span>
                  </div>
                  {review.title ? <h2>{review.title}</h2> : null}
                  <p>{review.comment || "No written comment."}</p>
                </div>

                <div className="admin-review-actions">
                  <span className={`admin-review-status ${status}`}>{status}</span>
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
          })
        )}
      </div>
    </section>
  );
}
