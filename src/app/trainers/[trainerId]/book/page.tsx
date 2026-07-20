"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Check, CreditCard, MapPin, Star, WalletCards } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createBooking } from "@/features/bookings";
import { BackendTrainer, fetchPublicTrainer, normalizeTrainerPhotoUrl } from "@/features/trainers";

type SessionType = "single" | "five_pack" | "ten_pack";
type PaymentMethod = "esewa" | "khalti" | "card" | "cash";

const dayIndexes: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const sessionOptions: Array<{ id: SessionType; label: string; count: number; multiplier: number }> = [
  { id: "single", label: "Single Session", count: 1, multiplier: 1 },
  { id: "five_pack", label: "5-Session Pack", count: 5, multiplier: 4.5 },
  { id: "ten_pack", label: "10-Session Pack", count: 10, multiplier: 8.5 },
];

const formatMoney = (value: number) => `Npr ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatTime = (value: string) => value.replace(/:00/g, "").replace(/\s*(AM|PM)/gi, (_, p: string) => ` ${p.toLowerCase()}`).replace(/\s*[–—-]\s*/g, " - ").trim();
const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const nextDateForDay = (day: string) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const target = dayIndexes[day] ?? date.getDay();
  let difference = (target - date.getDay() + 7) % 7;
  if (difference === 0) difference = 7;
  date.setDate(date.getDate() + difference);
  return toDateInput(date);
};

function BookingFlow() {
  const { trainerId } = useParams<{ trainerId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const selectedDay = searchParams.get("day") || "mon";
  const selectedTime = searchParams.get("time") || "";
  const selectedDateParam = searchParams.get("date") || "";
  const [trainer, setTrainer] = useState<BackendTrainer | null>(null);
  const [step, setStep] = useState(1);
  const [sessionType, setSessionType] = useState<SessionType>("single");
  const [date, setDate] = useState(() => selectedDateParam || nextDateForDay(selectedDay));
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("esewa");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublicTrainer(trainerId)
      .then((nextTrainer) => setTrainer(nextTrainer || null))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load trainer."));
  }, [trainerId]);

  useEffect(() => {
    if (!user) return;
    setContactName(`${user.firstName} ${user.lastName}`.trim());
    setContactEmail(user.email);
    setContactPhone(user.phone || "");
  }, [user]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      const returnPath = selectedDateParam
        ? `/trainers/${trainerId}/book?date=${selectedDateParam}&time=${encodeURIComponent(selectedTime)}`
        : `/trainers/${trainerId}/book?day=${selectedDay}&time=${encodeURIComponent(selectedTime)}`;
      router.replace(`/login?redirect=${encodeURIComponent(returnPath)}`);
    }
  }, [isAuthLoading, isAuthenticated, router, selectedDay, selectedDateParam, selectedTime, trainerId]);

  const selectedSession = sessionOptions.find((option) => option.id === sessionType) || sessionOptions[0];
  const subtotal = (trainer?.sessionRate || 0) * selectedSession.multiplier;
  const serviceFee = subtotal * 0.02;
  const total = subtotal + serviceFee;
  const trainerName = trainer ? `${trainer.userId.firstName} ${trainer.userId.lastName}` : "Trainer";
  const trainerPhoto = normalizeTrainerPhotoUrl(trainer?.userId.profilePicture);

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(date && selectedTime);
    if (step === 2) return Boolean(contactName.trim() && contactEmail.trim() && contactPhone.trim());
    return true;
  }, [contactEmail, contactName, contactPhone, date, selectedTime, step]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await createBooking({ trainerId, slotDate: date, timeLabel: selectedTime, sessionType, contactName, contactEmail, contactPhone, paymentMethod });
      router.push("/user/bookings?created=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || !trainer || !isAuthenticated) {
    return <main className="booking-checkout-page"><div className="cart-state-card">Loading booking...</div></main>;
  }

  return (
    <main className="booking-checkout-page">
      <Link href={`/trainers/${trainerId}`} className="booking-back-link">← Back to trainer</Link>
      <h1>Book a Session</h1>
      <div className="booking-stepper" aria-label={`Booking step ${step} of 3`}>
        {["Session", "Contact", "Payment"].map((label, index) => {
          const number = index + 1;
          return <div className={number <= step ? "active" : ""} key={label}><span>{number < step ? <Check /> : number}</span><strong>{label}</strong></div>;
        })}
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      <div className="booking-checkout-layout">
        <section className="booking-step-panel">
          {step === 1 ? <>
            <h2>Select Session Type</h2>
            <div className="booking-option-list">
              {sessionOptions.map((option) => <button type="button" className={sessionType === option.id ? "selected" : ""} onClick={() => setSessionType(option.id)} key={option.id}><strong>{option.label}</strong><span>{formatMoney((trainer.sessionRate || 0) * option.multiplier)}</span></button>)}
            </div>
            <div className="booking-field-row">
              <label><span>Date</span><input type="date" min={toDateInput(new Date(Date.now() + 864e5))} value={date} onChange={(event) => setDate(event.target.value)} /></label>
              <label><span>Time</span><input value={formatTime(selectedTime)} readOnly /></label>
            </div>
          </> : null}

          {step === 2 ? <>
            <h2>Contact Information</h2>
            <label><span>Full name</span><input value={contactName} onChange={(event) => setContactName(event.target.value)} /></label>
            <label><span>Email</span><input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} /></label>
            <label><span>Phone</span><input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} /></label>
          </> : null}

          {step === 3 ? <>
            <h2>Payment Method</h2>
            <div className="booking-option-list booking-payment-list">
              {([
                ["esewa", "eSewa"], ["khalti", "Khalti"], ["card", "Credit / Debit Card"], ["cash", "Cash on Delivery"],
              ] as Array<[PaymentMethod, string]>).map(([id, label]) => <button type="button" className={paymentMethod === id ? "selected" : ""} onClick={() => setPaymentMethod(id)} key={id}>{id === "card" ? <CreditCard /> : <WalletCards />}<strong>{label}</strong></button>)}
            </div>
          </> : null}

          <div className="booking-step-actions">
            <button type="button" className="secondary" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>Back</button>
            {step < 3 ? <button type="button" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>Continue</button> : <button type="button" disabled={isSubmitting} onClick={handleConfirm}>{isSubmitting ? "Confirming..." : "Confirm Booking"}</button>}
          </div>
        </section>

        <aside className="booking-summary-card">
          <div className="booking-summary-trainer">
            {trainerPhoto ? <img src={trainerPhoto} alt="" /> : <span>{trainer.userId.firstName[0]}{trainer.userId.lastName[0]}</span>}
            <div><strong>{trainerName}</strong><small><MapPin /> {trainer.location || "Nepal"}</small><small><Star /> New trainer</small></div>
          </div>
          <dl><div><dt>Session</dt><dd>{selectedSession.label}</dd></div><div><dt>Date</dt><dd>{date}</dd></div><div><dt>Time</dt><dd>{formatTime(selectedTime)}</dd></div></dl>
          <dl className="booking-summary-cost"><div><dt>Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div><div><dt>Service fee (2%)</dt><dd>{formatMoney(serviceFee)}</dd></div><div className="total"><dt>Total</dt><dd>{formatMoney(total)}</dd></div></dl>
        </aside>
      </div>
    </main>
  );
}

export default function TrainerBookingPage() {
  return <Suspense fallback={<main className="booking-checkout-page">Loading booking...</main>}><BookingFlow /></Suspense>;
}
