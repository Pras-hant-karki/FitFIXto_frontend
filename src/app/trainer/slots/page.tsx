"use client";

import { Fragment, useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { TrainerDashboardShell } from "@/components/shared/trainer";
import { useToast } from "@/contexts";
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
  "6 AM – 7 AM", "7 AM – 8 AM", "8 AM – 9 AM", "9 AM – 10 AM",
  "10 AM – 11 AM", "11 AM – 12 PM", "12 PM – 1 PM", "1 PM – 2 PM",
  "2 PM – 3 PM", "3 PM – 4 PM", "4 PM – 5 PM", "5 PM – 6 PM",
  "6 PM – 7 PM", "7 PM – 8 PM",
];

const DAY_KEY_TO_JS: Record<DayKey, number> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
};

const toDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getThisWeekDate = (dayKey: DayKey): string => {
  const today = new Date();
  const todayJs = today.getDay();
  const targetJs = DAY_KEY_TO_JS[dayKey];
  const diff = targetJs - todayJs;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return toDateStr(d);
};

const getMonthInfo = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return { daysInMonth: last.getDate(), startPadSun: first.getDay() };
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function TrainerSlotsPage() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [slotMap, setSlotMap] = useState<Map<string, AvailabilitySlot>>(new Map());
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());

  const today = new Date();
  const todayStr = toDateStr(today);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const months3 = [0, 1, 2].map((offset) => {
    const ref = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return { year: ref.getFullYear(), month: ref.getMonth(), ...getMonthInfo(ref.getFullYear(), ref.getMonth()) };
  });

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const [slotsRes, datesRes] = await Promise.all([
          apiClient.get<{ availability: AvailabilitySlot[] }>(API_ENDPOINTS.trainers.myAvailability),
          apiClient.get<{ availableDates: { date: string }[] }>(API_ENDPOINTS.trainers.myAvailableDates),
        ]);
        if (!isActive) return;
        const data = slotsRes.data?.availability || [];
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
        setMarkedDates(new Set((datesRes.data?.availableDates || []).map((d) => d.date.slice(0, 10))));
      } catch (err) {
        if (isActive) toast.error(err instanceof Error ? err.message : "Unable to load availability.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    load();
    return () => { isActive = false; };
  }, []);

  const toggleSlot = (day: DayKey, time: string) => {
    const k = `${day}|${time}`;
    const willBeOn = !activeKeys.has(k);
    const nextKeys = new Set(activeKeys);
    willBeOn ? nextKeys.add(k) : nextKeys.delete(k);
    setActiveKeys(nextKeys);

    const dayWillHaveActive = TIME_SLOTS.some(t => nextKeys.has(`${day}|${t}`));
    const dateStr = getThisWeekDate(day);
    setMarkedDates(cur => {
      const next = new Set(cur);
      if (dayWillHaveActive) next.add(dateStr);
      else next.delete(dateStr);
      return next;
    });
  };

  const toggleCalendarDate = (dateStr: string) => {
    setMarkedDates(cur => {
      const next = new Set(cur);
      next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const toCreate: { dayOfWeek: DayKey; timeLabel: string }[] = [];
      const toActivate: AvailabilitySlot[] = [];
      const toDeactivate: AvailabilitySlot[] = [];

      for (const { key: day } of DAYS) {
        for (const time of TIME_SLOTS) {
          const k = `${day}|${time}`;
          const existing = slotMap.get(k);
          const isNowActive = activeKeys.has(k);
          if (isNowActive && !existing) toCreate.push({ dayOfWeek: day, timeLabel: time });
          else if (isNowActive && existing && !existing.isActive) toActivate.push(existing);
          else if (!isNowActive && existing && existing.isActive) toDeactivate.push(existing);
        }
      }

      const created: AvailabilitySlot[] = [];
      for (const payload of toCreate) {
        const res = await apiClient.post<{ availability: AvailabilitySlot }>(
          API_ENDPOINTS.trainers.availability,
          { ...payload, isActive: true }
        );
        if (res.data?.availability) created.push(res.data.availability);
      }

      const activated: AvailabilitySlot[] = [];
      for (const slot of toActivate) {
        const res = await apiClient.put<{ availability: AvailabilitySlot }>(
          API_ENDPOINTS.trainers.availabilityDetail(slot._id),
          { isActive: true }
        );
        if (res.data?.availability) activated.push(res.data.availability);
      }

      const deactivated: AvailabilitySlot[] = [];
      for (const slot of toDeactivate) {
        const res = await apiClient.put<{ availability: AvailabilitySlot }>(
          API_ENDPOINTS.trainers.availabilityDetail(slot._id),
          { isActive: false }
        );
        if (res.data?.availability) deactivated.push(res.data.availability);
      }

      setSlotMap(cur => {
        const next = new Map(cur);
        [...created, ...activated, ...deactivated].forEach((s) => next.set(`${s.dayOfWeek}|${s.timeLabel}`, s));
        return next;
      });

      await apiClient.post(API_ENDPOINTS.trainers.myAvailableDates, { dates: Array.from(markedDates) });

      const totalChanged = toCreate.length + toActivate.length + toDeactivate.length;
      toast.success(totalChanged > 0
        ? `Availability saved — ${totalChanged} slot${totalChanged === 1 ? "" : "s"} updated.`
        : "Calendar availability saved."
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save availability.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Remove all your availability slots and calendar dates?")) return;
    setIsSaving(true);
    try {
      for (const slot of slots) {
        await apiClient.delete(API_ENDPOINTS.trainers.availabilityDetail(slot._id));
      }
      await apiClient.post(API_ENDPOINTS.trainers.myAvailableDates, { dates: [] });
      setSlots([]);
      setSlotMap(new Map());
      setActiveKeys(new Set());
      setMarkedDates(new Set());
      toast.success("All availability cleared.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to clear availability.");
    } finally {
      setIsSaving(false);
    }
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
              disabled={isSaving || (slots.length === 0 && markedDates.size === 0)}
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
          Toggle time slots for your weekly schedule. Enabling a day auto-marks <strong>this week's</strong> date on the calendar. Click any calendar date directly to mark future availability.
        </p>

        {isLoading ? (
          <div className="customer-orders-empty">Loading availability...</div>
        ) : (
          <>
            <div className="trainer-slots-section">
              <h3 className="trainer-settings-heading">Weekly Schedule</h3>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
                Toggle cells to set which times you're open each day of the week.
              </p>
              <div className="trainer-slots-grid-wrap">
                <div className="trainer-slots-grid">
                  <div className="trainer-slots-time-col" />
                  {DAYS.map((d) => (
                    <div className="trainer-slots-day-head" key={d.key}>{d.short}</div>
                  ))}
                  {TIME_SLOTS.map((time) => (
                    <Fragment key={time}>
                      <div className="trainer-slots-time-label">{time}</div>
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
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div className="trainer-slots-section" style={{ marginTop: 36 }}>
              <div className="trainer-3cal-header">
                <h3 className="trainer-settings-heading" style={{ margin: 0 }}>Calendar Availability</h3>
                <p className="trainer-3cal-sub">
                  Click a date to mark it available. Black = available, white = unavailable.{" "}
                  <strong>{markedDates.size} day{markedDates.size === 1 ? "" : "s"} marked.</strong>
                </p>
              </div>

              <div className="trainer-3cal-wrap">
                {months3.map(({ year, month, daysInMonth, startPadSun }) => (
                  <div key={`${year}-${month}`} className="trainer-3cal-month">
                    <div className="trainer-3cal-title">
                      {MONTH_NAMES[month]} {year}
                    </div>
                    <div className="trainer-3cal-grid">
                      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                        <div className="trainer-3cal-day-head" key={i}>{d}</div>
                      ))}
                      {Array.from({ length: startPadSun }).map((_, i) => (
                        <div className="trainer-3cal-cell empty" key={`pad-${i}`} />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                        const isToday = dateStr === todayStr;
                        const isMarked = markedDates.has(dateStr);
                        const isPast = new Date(year, month, dayNum) < todayMidnight;
                        return (
                          <div
                            key={dayNum}
                            className={`trainer-3cal-cell${isToday ? " today" : ""}${isMarked && !isPast ? " available" : ""}${isPast ? " past" : ""}`}
                            onClick={() => !isPast && toggleCalendarDate(dateStr)}
                            role={isPast ? undefined : "button"}
                            tabIndex={isPast ? undefined : 0}
                            onKeyDown={(e) => !isPast && e.key === "Enter" && toggleCalendarDate(dateStr)}
                            aria-pressed={!isPast ? isMarked : undefined}
                            style={{ cursor: isPast ? "default" : "pointer" }}
                          >
                            {dayNum}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="trainer-cal-legend">
                <span><i className="trainer-cal-dot available" />Available</span>
                <span><i className="trainer-cal-dot today" />Today</span>
              </div>
            </div>
          </>
        )}
      </div>
    </TrainerDashboardShell>
  );
}
