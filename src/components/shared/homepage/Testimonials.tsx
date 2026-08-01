"use client";

import { useEffect, useState } from "react";
import { fetchFeaturedReviews, type FeaturedReview } from "@/features/reviews";

const starLabel = (n: number) => `${n} out of 5 stars`;

/** Shows a first name plus last initial ("Bishal R.") so testimonials stay semi-anonymous. */
const reviewerName = (review: FeaturedReview) => {
  const full = review.authorName.trim();
  if (!full) return "Verified Customer";

  const parts = full.split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
};

const kindLabel: Record<FeaturedReview["kind"], string> = {
  product: "Verified purchase",
  trainer: "Trainer session",
  service: "Service",
};

const stars = (n: number) =>
  Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < n ? "star active" : "star"} aria-hidden="true">
      &#9733;
    </span>
  ));

export function Testimonials() {
  const [reviews, setReviews] = useState<FeaturedReview[]>([]);

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
            <article className="testimonial-card" key={`${review.kind}-${review.id}`}>
              <div className="stars" aria-label={starLabel(review.rating)}>
                {stars(review.rating)}
              </div>
              <p>&quot;{review.comment}&quot;</p>
              <div>
                <strong>{reviewerName(review)}</strong>
                <span>
                  {kindLabel[review.kind]}
                  {review.subject ? ` · ${review.subject}` : ""}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
