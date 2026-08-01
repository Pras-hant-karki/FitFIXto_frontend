"use client";

import { useEffect, useState } from "react";
import { fetchFeaturedReviews, BackendReview } from "@/features/reviews";

const starLabel = (n: number) => `${n} out of 5 stars`;

const reviewerName = (review: BackendReview) => {
  if (typeof review.userId === "string") return "Verified Customer";
  const { firstName, lastName } = review.userId;
  const full = `${firstName || ""} ${lastName || ""}`.trim();
  if (!full) return "Verified Customer";
  // Show first name + last initial for privacy: "Bishal R."
  const parts = full.split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
};

const stars = (n: number) =>
  Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < n ? "star active" : "star"} aria-hidden="true">
      &#9733;
    </span>
  ));

export function Testimonials() {
  const [reviews, setReviews] = useState<BackendReview[]>([]);

  useEffect(() => {
    fetchFeaturedReviews()
      .then(setReviews)
      .catch(() => {});
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="home-section" id="reviews">
      <div className="section-inner">
        <div className="section-heading compact">
          <p>Real Talk</p>
          <h2>What lifters say</h2>
        </div>

        <div className="testimonial-grid">
          {reviews.map((review) => (
            <article className="testimonial-card" key={review._id}>
              <div className="stars" aria-label={starLabel(review.rating)}>
                {stars(review.rating)}
              </div>
              <p>&quot;{review.comment || review.title || ""}&quot;</p>
              <div>
                <strong>{reviewerName(review)}</strong>
                <span>Verified</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
