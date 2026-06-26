"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Award, Check, MapPin, Star } from "lucide-react";
import {
  BackendTrainer,
  fetchPublicTrainer,
  normalizeTrainerPhotoUrl,
} from "@/features/trainers";

const getTrainerName = (trainer: BackendTrainer) =>
  `${trainer.userId.firstName || ""} ${trainer.userId.lastName || ""}`.trim() || "FitFIXto Trainer";

const getTrainerPhoto = (trainer: BackendTrainer) =>
  normalizeTrainerPhotoUrl(trainer.userId.profilePicture);

const formatLocation = (location?: string) => location || "Nepal";

export default function TrainerDetailsPage() {
  const params = useParams<{ trainerId: string }>();
  const trainerId = params.trainerId;
  const [trainer, setTrainer] = useState<BackendTrainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadTrainer = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextTrainer = await fetchPublicTrainer(trainerId);
        if (!nextTrainer) {
          throw new Error("Trainer not found.");
        }

        if (isActive) {
          setTrainer(nextTrainer);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Unable to load trainer.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    if (trainerId) {
      loadTrainer();
    }

    return () => {
      isActive = false;
    };
  }, [trainerId]);

  const trainerPhoto = trainer ? getTrainerPhoto(trainer) : "";
  const trainerName = trainer ? getTrainerName(trainer) : "";
  const specialtyLine = useMemo(() => trainer?.specialties.join(" · ") || "Personal Training", [trainer?.specialties]);

  if (isLoading) {
    return (
      <main className="trainer-detail-page">
        <section className="cart-state-card">
          <strong>Loading trainer...</strong>
          <span>Please wait while we fetch trainer details.</span>
        </section>
      </main>
    );
  }

  if (error || !trainer) {
    return (
      <main className="trainer-detail-page">
        <section className="cart-state-card">
          <strong>Unable to load trainer.</strong>
          <span>{error || "Trainer not found."}</span>
          <Link href="/trainers">Back to Trainers</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="trainer-detail-page">
      <Link href="/trainers" className="trainer-detail-back">
        ← Back to Trainers
      </Link>

      <section className="trainer-detail-layout">
        <aside className="trainer-detail-sidebar">
          <div className="trainer-detail-photo">
            {trainerPhoto ? <img src={trainerPhoto} alt={trainerName} /> : <span>No photo</span>}
          </div>
          <div className="trainer-detail-booking-card">
            <button type="button">Book Session</button>
            <div>
              <span>Per session</span>
              <strong>Npr {Math.round(trainer.sessionRate).toLocaleString()}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>
                <MapPin aria-hidden="true" />
                {formatLocation(trainer.location)}
              </strong>
            </div>
            <div>
              <span>Experience</span>
              <strong>{trainer.experienceYears}+ yrs</strong>
            </div>
            <div>
              <span>Rating</span>
              <strong>
                <Star aria-hidden="true" />
                New
              </strong>
            </div>
          </div>
        </aside>

        <section className="trainer-detail-main">
          <header>
            <h1>{trainerName}</h1>
            <p>{specialtyLine}</p>
          </header>

          <nav className="trainer-detail-tabs" aria-label="Trainer detail sections">
            <button type="button" className="active">About</button>
            <button type="button">Programs</button>
            <button type="button">Availability</button>
            <button type="button">Reviews</button>
          </nav>

          <section className="trainer-detail-section">
            <p>{trainer.userId.bio || "No trainer bio added yet."}</p>
          </section>

          <section className="trainer-detail-section">
            <h2>Certifications</h2>
            {trainer.certifications.length ? (
              <ul className="trainer-detail-check-list">
                {trainer.certifications.map((certification) => (
                  <li key={certification}>
                    <Check aria-hidden="true" />
                    {certification}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No certifications added yet.</p>
            )}
          </section>

          <section className="trainer-detail-section">
            <h2>Specializations</h2>
            <div className="trainer-detail-specialties">
              {trainer.specialties.length ? (
                trainer.specialties.map((specialty) => (
                  <article key={specialty}>
                    <Award aria-hidden="true" />
                    <strong>{specialty}</strong>
                  </article>
                ))
              ) : (
                <article>
                  <Award aria-hidden="true" />
                  <strong>Personal Training</strong>
                </article>
              )}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
