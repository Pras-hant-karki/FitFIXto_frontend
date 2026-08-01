"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { BackendTrainer, fetchPublicTrainers, normalizeTrainerPhotoUrl } from "@/features/trainers";
import { usePreferences } from "@/contexts";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const isNewTrainer = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < SEVEN_DAYS_MS;

const getTrainerName = (trainer: BackendTrainer) =>
  `${trainer.userId.firstName || ""} ${trainer.userId.lastName || ""}`.trim() || "FitFIXto Trainer";

function FeaturedTrainerCard({ trainer }: { trainer: BackendTrainer }) {
  const { formatPrice } = usePreferences();
  const name = getTrainerName(trainer);
  const photo = normalizeTrainerPhotoUrl(trainer.userId.profilePicture);
  const isNew = isNewTrainer(trainer.createdAt);
  const averageRating = trainer.averageRating ?? 0;
  const ratingCount = trainer.ratingCount ?? 0;
  const specialtiesLabel = trainer.specialties.slice(0, 3).join(" • ") || "Personal Training";

  return (
    <Link href={`/trainers/${trainer._id}`} className="featured-trainer-card">
      <div className="featured-trainer-img">
        {photo ? (
          <img src={photo} alt={name} />
        ) : (
          <div className="featured-trainer-no-photo">No photo</div>
        )}
      </div>
      <div className="featured-trainer-body">
        <div className="featured-trainer-top">
          <h3>{name}</h3>
          <div className="featured-trainer-rating">
            <Star aria-hidden="true" />
            <span>{isNew ? "New" : averageRating.toFixed(1)}</span>
            {!isNew ? <em>({ratingCount})</em> : null}
          </div>
        </div>
        <p className="featured-trainer-specialties">{specialtiesLabel}</p>
        <strong className="featured-trainer-price">
          {formatPrice(trainer.sessionRate)}<span>/session</span>
        </strong>
      </div>
    </Link>
  );
}

export function FeaturedTrainers() {
  const [trainers, setTrainers] = useState<BackendTrainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPublicTrainers()
      .then((all) => setTrainers(all.filter((t) => t.isFeatured)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || trainers.length === 0) return null;

  return (
    <section className="home-section section-soft" id="featured-trainers">
      <div className="section-inner">
        <div className="section-heading">
          <p>Train Smarter</p>
          <h2>Featured Trainers</h2>
          <span>Certified coaches, vetted by our team.</span>
        </div>
        <div className="featured-trainer-grid">
          {trainers.map((trainer) => (
            <FeaturedTrainerCard key={trainer._id} trainer={trainer} />
          ))}
        </div>
        <div className="featured-trainer-footer">
          <Link href="/trainers" className="button button-outline">
            View All Trainers →
          </Link>
        </div>
      </div>
    </section>
  );
}
