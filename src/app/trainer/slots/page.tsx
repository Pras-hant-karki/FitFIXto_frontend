"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Save, Trash2 } from "lucide-react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/lib";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface AvailabilitySlot {
  _id: string;
  dayOfWeek: DayKey;
  timeLabel: string;
  isActive: boolean;
}

const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
];

const TIME_SLOTS = [
  "6:00 AM – 7:00 AM",
  "7:00 AM – 8:00 AM",
  "8:00 AM – 9:00 AM",
  "9:00 AM – 10:00 AM",
  "10:00 AM – 11:00 AM",
  "11:00 AM – 12:00 PM",
  "12:00 PM – 1:00 PM",
  "1:00 PM – 2:00 PM",
  "2:00 PM – 3:00 PM",
  "3:00 PM – 4:00 PM",
  "4:00 PM – 5:00 PM",
  "5:00 PM – 6:00 PM",
  "6:00 PM – 7:00 PM",
  "7:00 PM – 8:00 PM",
];

const JS_DAY_TO_KEY: Record<number, DayKey> = {
  1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat", 0: "sun",
};

const getMonthInfo = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = (first.getDay() + 6) % 7; // pad so week starts Monday
  return { first, last, daysInMonth: last.getDate(), startPad };
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function TrainerSlotsPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Calendar navigation — show current month + next 2
  const today = new Date();
  const [calOffset, setCalOffset] = useState(0); // 0 = current month
  const displayYear =
    calOffset === 0
      ? today.getFullYear()
      : calOffset === 1
      ? new Date(today.getFullYear(), today.getMonth() + 1, 1).getFullYear()
      : new Date(today.getFullYear(), today.getMonth() + 2, 1).getFullYear();
  const displayMonth =
    calOffset === 0
      ? today.getMonth()
      : calOffset === 1
      ? (today.getMonth() + 1) % 12
      : (today.getMonth() + 2) % 12;

  const { daysInMonth, startPad } = getMonthInfo(displayYear, displayMonth);

  // Local toggle state: set of "day|time" pairs that are currently active
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  // Track which slots we know about keyed by "day|time"
  const [slotMap, setSlotMap] = useState<Map<string, AvailabilitySlot>>(new Map());

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await apiClient.get<{ availability: AvailabilitySlot[] }>(
          API_ENDPOINTS.trainers.myAvailability
        );
        const data = res.data?.availability || [];
        if (isActive) {
          setSlots(data);
          const newMap = new Map<string, AvailabilitySlot>();
          const newActive = new Set<string>();
          data.forEach((s) => {
            const k = `${s.dayOfWeek}|${s.timeLabel}`;
            newMap.set(k, s);
            if (s.isActive) newActive.add(k);
          });
          setSlotMap(newMap);
          setActiveKeys(newActive);
        }
      } catch (err) {
        if (isActive) setError(err instanceof Error ? err.message : "Unable to load availability.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    load();
    return () => { isActive = false; };
  }, []);

  const toggleSlot = (day: DayKey, time: string) => {
    const k = `${day}|${time}`;
    setActiveKeys((cur) => {
      const next = new Set(cur);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
    setMessage("");
    setError("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      // For each active key: if slot doesn't exist → create, if exists + active → ensure isActive=true
      // For each inactive key that has an existing slot: if isActive=true → update to false OR delete
      const toCreate: { dayOfWeek: DayKey; timeLabel: string }[] = [];
      const toActivate: AvailabilitySlot[] = [];
      const toDeactivate: AvailabilitySlot[] = [];

      for (const day of DAYS.map((d) => d.key)) {
        for (const time of TIME_SLOTS) {
          const k = `${day}|${time}`;
          const existing = slotMap.get(k);
          const isNowActive = activeKeys.has(k);

          if (isNowActive && !existing) {
            toCreate.push({ dayOfWeek: day as DayKey, timeLabel: time });
          } else if (isNowActive && existing && !existing.isActive) {
            toActivate.push(existing);
          } else if (!isNowActive && existing && existing.isActive) {
            toDeactivate.push(existing);
          }
        }
      }

      // Create new slots
      const created: AvailabilitySlot[] = [];
      for (const payload of toCreate) {
        const res = await apiClient.post<{ availability: AvailabilitySlot }>(
          API_ENDPOINTS.trainers.availability,
          { ...payload, isActive: true }
        );
        if (res.data?.availability) created.push(res.data.availability);
      }

      // Activate deactivated slots
      const activated: AvailabilitySlot[] = [];
      for (const slot of toActivate) {
        const res = await apiClient.put<{ availability: AvailabilitySlot }>(
          API_ENDPOINTS.trainers.availabilityDetail(slot._id),
          { isActive: true }
        );
        if (res.data?.availability) activated.push(res.data.availability);
      }

      // Deactivate slots that were toggled off
      const deactivated: AvailabilitySlot[] = [];
      for (const slot of toDeactivate) {
        const res = await apiClient.put<{ availability: AvailabilitySlot }>(
          API_ENDPOINTS.trainers.availabilityDetail(slot._id),
          { isActive: false }
        );
        if (res.data?.availability) deactivated.push(res.data.availability);
      }

      // Merge updates into slotMap
      setSlotMap((cur) => {
        const next = new Map(cur);
        [...created, ...activated, ...deactivated].forEach((s) => {
          next.set(`${s.dayOfWeek}|${s.timeLabel}`, s);
        });
        return next;
      });

      const totalChanged = toCreate.length + toActivate.length + toDeactivate.length;
      setMessage(totalChanged > 0 ? `Availability saved — ${totalChanged} slot${totalChanged === 1 ? "" : "s"} updated.` : "No changes to save.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save availability.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Remove all your availability slots?")) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      for (const slot of slots) {
        await apiClient.delete(API_ENDPOINTS.trainers.availabilityDetail(slot._id));
      }
      setSlots([]);
      setSlotMap(new Map());
      setActiveKeys(new Set());
      setMessage("All availability cleared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to clear availability.");
    } finally {
      setIsSaving(false);
    }
  };

  // Calendar helpers
  const getDayKey = (date: Date): DayKey | null => JS_DAY_TO_KEY[date.getDay()] ?? null;

  const isDayAvailable = (date: Date) => {
    const key = getDayKey(date);
    if (!key) return false;
    return TIME_SLOTS.some((t) => activeKeys.has(`${key}|${t}`));
  };

  return (
    <TrainerDashboardShell>
      <div className="customer-orders-panel">
        <div className="customer-orders-heading">
          <h2>Slots</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="trainer-slots-clear-btn"
              onClick={handleClearAll}
              disabled={isSaving || slots.length === 0}
            >
              <Trash2 aria-hidden="true" />
              Clear All
            </button>
            <button
              type="button"
              className="customer-reorder-button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              <Save aria-hidden="true" />
              {isSaving ? "Saving..." : "Save Availability"}
            </button>
          </div>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0, marginBottom: 24 }}>
          Toggle your available time slots below. Changes apply weekly — clients will see which days you're open across all months.
        </p>

        {error ? <p className="auth-message error" style={{ marginBottom: 14 }}>{error}</p> : null}
        {message ? <p className="customer-review-message" style={{ marginBottom: 14 }}>{message}</p> : null}

        {isLoading ? (
          <div className="customer-orders-empty">Loading availability...</div>
        ) : (
          <>
            {/* Weekly Schedule Grid */}
            <div className="trainer-slots-section">
              <h3 className="trainer-settings-heading">Weekly Schedule</h3>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
                Click a cell to toggle. Highlighted cells = available.
              </p>
              <div className="trainer-slots-grid-wrap">
                <div className="trainer-slots-grid">
                  {/* Header row */}
                  <div className="trainer-slots-time-col" />
                  {DAYS.map((d) => (
                    <div className="trainer-slots-day-head" key={d.key}>{d.short}</div>
                  ))}

                  {/* Time rows */}
                  {TIME_SLOTS.map((time) => (
                    <>
                      <div className="trainer-slots-time-label" key={`label-${time}`}>{time}</div>
                      {DAYS.map((d) => {
                        const k = `${d.key}|${time}`;
                        const isOn = activeKeys.has(k);
                        return (
                          <button
                            type="button"
                            key={k}
                            className={`trainer-slots-cell${isOn ? " active" : ""}`}
                            onClick={() => toggleSlot(d.key, time)}
                            disabled={isSaving}
                            aria-pressed={isOn}
                            aria-label={`${d.label} ${time} — ${isOn ? "available" : "unavailable"}`}
                          >
                            {isOn ? "✓" : ""}
                          </button>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </div>

            {/* Calendar Preview */}
            <div className="trainer-slots-section" style={{ marginTop: 36 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 className="trainer-settings-heading" style={{ margin: 0 }}>Calendar Preview</h3>
                <div className="trainer-slots-cal-nav">
                  <button
                    type="button"
                    onClick={() => setCalOffset((c) => Math.max(0, c - 1))}
                    disabled={calOffset === 0}
                    aria-label="Previous month"
                  >
                    <ChevronLeft aria-hidden="true" />
                  </button>
                  <span>{MONTH_NAMES[displayMonth]} {displayYear}</span>
                  <button
                    type="button"
                    onClick={() => setCalOffset((c) => Math.min(2, c + 1))}
                    disabled={calOffset === 2}
                    aria-label="Next month"
                  >
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="trainer-slots-calendar">
                {/* Day headers */}
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                  <div className="trainer-cal-head" key={d}>{d}</div>
                ))}

                {/* Padding cells */}
                {Array.from({ length: startPad }).map((_, i) => (
                  <div className="trainer-cal-cell empty" key={`pad-${i}`} />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(displayYear, displayMonth, day);
                  const isToday =
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
                  const available = isDayAvailable(date);
                  const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                  return (
                    <div
                      key={day}
                      className={`trainer-cal-cell${isToday ? " today" : ""}${available && !isPast ? " available" : ""}${isPast ? " past" : ""}`}
                    >
                      <span>{day}</span>
                      {available && !isPast ? <i /> : null}
                    </div>
                  );
                })}
              </div>

              <div className="trainer-cal-legend">
                <span><i className="trainer-cal-dot available" />Available day</span>
                <span><i className="trainer-cal-dot today" />Today</span>
              </div>
            </div>
          </>
        )}
      </div>
    </TrainerDashboardShell>
  );
}
