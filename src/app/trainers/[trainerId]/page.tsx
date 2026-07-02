"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { usePreferences } from "@/contexts";

type Period = "this-week" | "next-week" | "next-month";

const getWeekStart = (offsetWeeks: number): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getDatesForPeriod = (p: Period): string[] => {
  const toStr = (d: Date) => d.toISOString().slice(0, 10);
  if (p === "this-week" || p === "next-week") {
    const start = getWeekStart(p === "this-week" ? 0 : 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return toStr(d);
    });
  }
  const today = new Date();
  const firstOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const daysInNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate();
  return Array.from({ length: daysInNextMonth }, (_, i) => {
    const d = new Date(firstOfNextMonth);
    d.setDate(i + 1);
    return toStr(d);
  });
};

const dayKeyFromDateStr = (dateStr: string): TrainerAvailabilityDay => {
  const d = new Date(dateStr + "T12:00:00");
  const map: Record<number, TrainerAvailabilityDay> = {
    0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
  };
  return map[d.getDay()];
};

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

const formatAvailabilityTime = (value: string) =>
  value
    .replace(/:00/g, "")
    .replace(/\s*(AM|PM)/gi, (_, period: string) => ` ${period.toLowerCase()}`)
    .replace(/\s*[–—-]\s*/g, " - ")
    .trim();

const timeToMinutes = (value: string) => {
  const match = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return hour * 60 + Number(match[2] || 0);
};

type TrainerDetailTab = "about" | "programs" | "availability" | "reviews";

export default function TrainerDetailsPage() {
  const params = useParams<{ trainerId: string }>();
  const trainerId = params.trainerId;
  const [trainer, setTrainer] = useState<BackendTrainer | null>(null);
  const [programs, setPrograms] = useState<BackendTrainerProgram[]>([]);
  const [availability, setAvailability] = useState<BackendTrainerAvailability[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [period, setPeriod] = useState<Period>("this-week");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<BackendTrainerAvailability | null>(null);
  const [activeTab, setActiveTab] = useState<TrainerDetailTab>("about");
  const router = useRouter();
  const { formatPrice } = usePreferences();
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
            nextAvailability.availability
              .filter((slot) => slot.isActive)
              .sort((left, right) => {
                const dayDiff = (dayOrder.get(left.dayOfWeek) ?? 0) - (dayOrder.get(right.dayOfWeek) ?? 0);
                return dayDiff || left.timeLabel.localeCompare(right.timeLabel);
              })
          );
          setAvailableDates(nextAvailability.availableDates);
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

  const periodAvailableDates = useMemo(() => {
    const availSet = new Set(availableDates);
    return getDatesForPeriod(period).filter((d) => availSet.has(d));
  }, [period, availableDates]);

  const getSlotsForDate = (dateStr: string) => {
    const dayKey = dayKeyFromDateStr(dateStr);
    const seen = new Set<string>();
    return availability
      .filter((slot) => slot.dayOfWeek === dayKey)
      .sort((a, b) => timeToMinutes(a.timeLabel) - timeToMinutes(b.timeLabel))
      .filter((slot) => {
        if (seen.has(slot.timeLabel)) return false;
        seen.add(slot.timeLabel);
        return true;
      });
  };

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
              <strong>{formatPrice(trainer.sessionRate)}</strong>
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
                      <strong>{formatPrice(program.price)}</strong>
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
              <div className="trainer-avail-period-switcher">
                {(["this-week", "next-week", "next-month"] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={period === p ? "active" : ""}
                    onClick={() => { setPeriod(p); setSelectedDate(""); setSelectedSlot(null); }}
                  >
                    {p === "this-week" ? "This Week" : p === "next-week" ? "Next Week" : "Next Month"}
                  </button>
                ))}
              </div>

              {periodAvailableDates.length === 0 ? (
                <section className="trainer-detail-empty-state">
                  <Award aria-hidden="true" />
                  <strong>No availability for this period</strong>
                  <span>Try another period or check back when the trainer updates their schedule.</span>
                </section>
              ) : (
                <>
                  {periodAvailableDates.map((dateStr) => {
                    const dateSlots = getSlotsForDate(dateStr);
                    if (dateSlots.length === 0) return null;
                    const dateLabel = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long", month: "long", day: "numeric",
                    });
                    return (
                      <div key={dateStr} className="trainer-avail-date-row">
                        <div className="trainer-avail-date-label">{dateLabel}</div>
                        <div className="trainer-avail-time-slots">
                          {dateSlots.map((slot) => {
                            const selKey = `${dateStr}-${slot._id}`;
                            const isSelected = selectedDate === dateStr && selectedSlot?._id === slot._id;
                            return (
                              <button
                                type="button"
                                key={selKey}
                                className={isSelected ? "selected" : ""}
                                onClick={() => { setSelectedDate(dateStr); setSelectedSlot(slot); }}
                              >
                                {formatAvailabilityTime(slot.timeLabel)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <div className="trainer-availability-actions">
                    <span>
                      {selectedSlot && selectedDate
                        ? `${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${formatAvailabilityTime(selectedSlot.timeLabel)}`
                        : "Choose a date and time slot to continue."}
                    </span>
                    <button
                      type="button"
                      disabled={!selectedSlot || !selectedDate}
                      onClick={() => {
                        if (!selectedSlot || !selectedDate) return;
                        router.push(
                          `/trainers/${trainerId}/book?date=${selectedDate}&time=${encodeURIComponent(selectedSlot.timeLabel)}`
                        );
                      }}
                    >
                      Proceed to Booking
                    </button>
                  </div>
                </>
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
