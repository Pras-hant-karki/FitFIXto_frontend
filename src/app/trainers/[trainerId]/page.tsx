"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Award, Check, MapPin, Star } from "lucide-react";
import {
  BackendTrainer,
  BackendTrainerAvailability,
  BackendTrainerProgram,
  TrainerAvailabilityDay,
  fetchPublicTrainer,
  fetchPublicTrainerAvailability,
  fetchPublicTrainerPrograms,
  normalizeTrainerPhotoUrl,
} from "@/features/trainers";

const getTrainerName = (trainer: BackendTrainer) =>
  `${trainer.userId.firstName || ""} ${trainer.userId.lastName || ""}`.trim() || "FitFIXto Trainer";

const getTrainerPhoto = (trainer: BackendTrainer) => normalizeTrainerPhotoUrl(trainer.userId.profilePicture);

const formatLocation = (location?: string) => location || "Nepal";

const dayOptions: Array<{ key: TrainerAvailabilityDay; label: string }> = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const dayOrder = new Map(dayOptions.map((day, index) => [day.key, index]));

type TrainerDetailTab = "about" | "programs" | "availability" | "reviews";

export default function TrainerDetailsPage() {
  const params = useParams<{ trainerId: string }>();
  const trainerId = params.trainerId;
  const [trainer, setTrainer] = useState<BackendTrainer | null>(null);
  const [programs, setPrograms] = useState<BackendTrainerProgram[]>([]);
  const [availability, setAvailability] = useState<BackendTrainerAvailability[]>([]);
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState("");
  const [activeTab, setActiveTab] = useState<TrainerDetailTab>("about");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadTrainer = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [nextTrainer, nextPrograms, nextAvailability] = await Promise.all([
          fetchPublicTrainer(trainerId),
          fetchPublicTrainerPrograms(trainerId),
          fetchPublicTrainerAvailability(trainerId),
        ]);

        if (!nextTrainer) {
          throw new Error("Trainer not found.");
        }

        if (isActive) {
          setTrainer(nextTrainer);
          setPrograms(nextPrograms.filter((program) => program.isActive));
          setAvailability(
            nextAvailability
              .filter((slot) => slot.isActive)
              .sort((left, right) => {
                const dayDiff = (dayOrder.get(left.dayOfWeek) ?? 0) - (dayOrder.get(right.dayOfWeek) ?? 0);
                return dayDiff || left.timeLabel.localeCompare(right.timeLabel);
              })
          );
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
  const availabilityTimes = useMemo(() => Array.from(new Set(availability.map((slot) => slot.timeLabel))).sort(), [availability]);
  const selectedAvailability = availability.find((slot) => slot._id === selectedAvailabilityId);

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
            <button type="button" onClick={() => setActiveTab("availability")}>
              Book Session
            </button>
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
            <button type="button" className={activeTab === "about" ? "active" : ""} onClick={() => setActiveTab("about")}>
              About
            </button>
            <button type="button" className={activeTab === "programs" ? "active" : ""} onClick={() => setActiveTab("programs")}>
              Programs
            </button>
            <button type="button" className={activeTab === "availability" ? "active" : ""} onClick={() => setActiveTab("availability")}>
              Availability
            </button>
            <button type="button" className={activeTab === "reviews" ? "active" : ""} onClick={() => setActiveTab("reviews")}>
              Reviews
            </button>
          </nav>

          {activeTab === "about" ? (
            <>
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
            </>
          ) : null}

          {activeTab === "programs" ? (
            <section className="trainer-program-list" aria-label={`${trainerName} programs`}>
              {programs.length ? (
                programs.map((program) => (
                  <article className="trainer-program-card" key={program._id}>
                    <div>
                      <h2>{program.title}</h2>
                      <p>
                        {program.durationWeeks} weeks · {program.sessions} sessions
                      </p>
                      {program.description ? <span>{program.description}</span> : null}
                    </div>
                    <div>
                      <strong>Npr {Math.round(program.price).toLocaleString()}</strong>
                      <button type="button">Select Program</button>
                    </div>
                  </article>
                ))
              ) : (
                <section className="trainer-detail-empty-state">
                  <Award aria-hidden="true" />
                  <strong>No programs available</strong>
                  <span>Programs added by this trainer will appear here.</span>
                </section>
              )}
            </section>
          ) : null}

          {activeTab === "availability" ? (
            <section className="trainer-availability-section">
              {availability.length ? (
                <>
                  <div className="trainer-availability-table" role="table" aria-label={`${trainerName} availability`}>
                    <div className="trainer-availability-row trainer-availability-head" role="row">
                      <strong role="columnheader">Time</strong>
                      {dayOptions.map((day) => (
                        <strong key={day.key} role="columnheader">
                          {day.label}
                        </strong>
                      ))}
                    </div>
                    {availabilityTimes.map((timeLabel) => (
                      <div className="trainer-availability-row" key={timeLabel} role="row">
                        <span role="cell">{timeLabel}</span>
                        {dayOptions.map((day) => {
                          const slot = availability.find((item) => item.dayOfWeek === day.key && item.timeLabel === timeLabel);

                          return (
                            <span key={`${day.key}-${timeLabel}`} role="cell">
                              {slot ? (
                                <button
                                  type="button"
                                  className={selectedAvailabilityId === slot._id ? "selected" : ""}
                                  onClick={() => setSelectedAvailabilityId(slot._id)}
                                >
                                  Book
                                </button>
                              ) : (
                                <em>—</em>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="trainer-availability-actions">
                    <span>
                      {selectedAvailability
                        ? `${dayOptions.find((day) => day.key === selectedAvailability.dayOfWeek)?.label} · ${selectedAvailability.timeLabel}`
                        : "Choose a day and time to continue."}
                    </span>
                    <button type="button" disabled={!selectedAvailability}>
                      Proceed to Booking
                    </button>
                  </div>
                </>
              ) : (
                <section className="trainer-detail-empty-state">
                  <Award aria-hidden="true" />
                  <strong>No availability added yet</strong>
                  <span>Availability slots added by this trainer will appear here.</span>
                </section>
              )}
            </section>
          ) : null}

          {activeTab === "reviews" ? (
            <section className="trainer-detail-empty-state">
              <Star aria-hidden="true" />
              <strong>No reviews yet</strong>
              <span>Customer reviews will appear after completed sessions.</span>
            </section>
          ) : null}
        </section>
      </section>
    </main>
  );
}
