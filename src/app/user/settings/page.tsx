"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerDashboardShell } from "@/components/shared/customer";
import { useAuth, useToast, usePreferences } from "@/contexts";
import type { CurrencyCode, LanguageCode, UnitSystem } from "@/contexts";

const NOTIF_KEY = "fitfixto_notifications";
const PRIVACY_KEY = "fitfixto_privacy";

const DEFAULT_NOTIF = { orderUpdates: true, promotions: true, bookingReminders: true, smsAlerts: false, pushNotifications: true };
const DEFAULT_PRIVACY = { publicProfile: false, showActivity: true, personalizedRecs: true };

const load = <T,>(key: string, def: T): T => {
  if (typeof window === "undefined") return def;
  try { const r = localStorage.getItem(key); return r ? { ...def, ...JSON.parse(r) } : def; } catch { return def; }
};
const save = (key: string, val: unknown) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

const LANGUAGE_OPTIONS: Array<{ value: LanguageCode; label: string }> = [
  { value: "", label: "English (default)" },
  { value: "en-AU", label: "English (Australia)" },
  { value: "en-CA", label: "English (Canada)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "ar-AE", label: "Arabic (UAE)" },
  { value: "ne", label: "Nepali" },
  { value: "hi", label: "Hindi" },
];

const CURRENCY_OPTIONS: Array<{ value: CurrencyCode; label: string }> = [
  { value: "NPR", label: "NPR — Nepalese Rupee (default)" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "INR", label: "INR — Indian Rupee" },
];

function ToggleSwitch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      className={`settings-toggle${on ? " on" : ""}`}
      onClick={onToggle}
      aria-pressed={on}
      aria-label={label}
    />
  );
}

export default function UserSettingsPage() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const { prefs, setPrefs } = usePreferences();
  const router = useRouter();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notif, setNotif] = useState(DEFAULT_NOTIF);
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    setTheme(stored ?? "light");
    setNotif(load(NOTIF_KEY, DEFAULT_NOTIF));
    setPrivacy(load(PRIVACY_KEY, DEFAULT_PRIVACY));
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };

  const updateNotif = (key: keyof typeof DEFAULT_NOTIF) => {
    const next = { ...notif, [key]: !notif[key] };
    setNotif(next);
    save(NOTIF_KEY, next);
  };

  const updatePrivacy = (key: keyof typeof DEFAULT_PRIVACY) => {
    const next = { ...privacy, [key]: !privacy[key] };
    setPrivacy(next);
    save(PRIVACY_KEY, next);
  };

  const handleLogout = () => { logout(); router.push("/login"); };

  const handleDeleteAccount = () => {
    toast.info("To delete your account, please contact support@fitfixto.com.");
    setShowDeleteModal(false);
  };

  return (
    <CustomerDashboardShell>
      <div className="settings-page">
        <div className="settings-page-header">
          <h2>Settings</h2>
          <p>Manage notifications, preferences, privacy and your account.</p>
        </div>

        <div className="settings-card">
          <h3 className="settings-card-title">Appearance</h3>
          <p className="settings-card-sub">Customize how FitFIXto looks on your device.</p>
          <div className="settings-toggle-row">
            <div className="settings-row-text">
              <strong>Theme</strong>
              <span>Switch between light and dark mode.</span>
            </div>
            <button type="button" className={`settings-theme-btn${theme === "dark" ? " active" : ""}`} onClick={toggleTheme}>
              {theme === "light" ? "☀ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>

        <div className="settings-card">
          <h3 className="settings-card-title">Notifications</h3>
          <p className="settings-card-sub">Choose what we contact you about.</p>
          {([
            { key: "orderUpdates", label: "Order updates", desc: "Shipping, delivery and status changes." },
            { key: "promotions", label: "Promotions & offers", desc: "Flash sales, bundles and discounts." },
            { key: "bookingReminders", label: "Booking reminders", desc: "Reminders for your training sessions." },
            { key: "smsAlerts", label: "SMS alerts", desc: "Text messages for time-sensitive updates." },
            { key: "pushNotifications", label: "Push notifications", desc: "In-browser push notifications." },
          ] as const).map(({ key, label, desc }) => (
            <div className="settings-toggle-row" key={key}>
              <div className="settings-row-text"><strong>{label}</strong><span>{desc}</span></div>
              <ToggleSwitch on={notif[key]} onToggle={() => updateNotif(key)} label={label} />
            </div>
          ))}
        </div>

        <div className="settings-card">
          <h3 className="settings-card-title">Preferences</h3>
          <p className="settings-card-sub">Language, currency and measurement units.</p>
          <div className="settings-pref-grid">
            <label className="settings-pref-label">
              Language
              <select
                value={prefs.language}
                onChange={(e) => setPrefs({ language: e.target.value as LanguageCode })}
                className="settings-pref-select"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            <label className="settings-pref-label">
              Currency
              <select
                value={prefs.currency}
                onChange={(e) => setPrefs({ currency: e.target.value as CurrencyCode })}
                className="settings-pref-select"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ marginTop: 16 }}>
            <strong className="settings-pref-label" style={{ display: "block", marginBottom: 8 }}>Units</strong>
            <div className="settings-units-btns">
              <button type="button" className={`settings-unit-btn${prefs.units === "metric" ? " active" : ""}`} onClick={() => setPrefs({ units: "metric" as UnitSystem })}>Metric (kg)</button>
              <button type="button" className={`settings-unit-btn${prefs.units === "imperial" ? " active" : ""}`} onClick={() => setPrefs({ units: "imperial" as UnitSystem })}>Imperial (lbs)</button>
            </div>
          </div>
          <p className="settings-card-sub" style={{ marginTop: 12, fontSize: 12 }}>
            Prices shown in {prefs.currency === "NPR" ? "Nepalese Rupee (NPR)" : prefs.currency} using approximate conversion rates. Actual charges are in NPR.
          </p>
        </div>

        <div className="settings-card">
          <h3 className="settings-card-title">Privacy</h3>
          <p className="settings-card-sub">Control your data and visibility.</p>
          {([
            { key: "publicProfile", label: "Public profile", desc: "Let others see your profile and reviews." },
            { key: "showActivity", label: "Show activity", desc: "Display your recent orders and bookings." },
            { key: "personalizedRecs", label: "Personalized recommendations", desc: "Use my activity to suggest products." },
          ] as const).map(({ key, label, desc }) => (
            <div className="settings-toggle-row" key={key}>
              <div className="settings-row-text"><strong>{label}</strong><span>{desc}</span></div>
              <ToggleSwitch on={privacy[key]} onToggle={() => updatePrivacy(key)} label={label} />
            </div>
          ))}
        </div>

        <div className="settings-card settings-danger-zone">
          <h3 className="settings-card-title">Danger zone</h3>
          <p className="settings-card-sub">Irreversible and destructive actions.</p>
          <div className="settings-danger-actions">
            <button type="button" className="settings-logout-btn" onClick={handleLogout}>
              Log out
            </button>
            <button type="button" className="settings-delete-btn" onClick={() => setShowDeleteModal(true)}>
              Delete account
            </button>
          </div>
        </div>

        <p className="settings-autosave-note">✓ Your settings save automatically.</p>
      </div>

      {showDeleteModal ? (
        <div className="user-order-modal-backdrop" role="presentation" onClick={() => setShowDeleteModal(false)}>
          <section className="user-order-cancel-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Delete account?</h2>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: "10px 0 20px" }}>
              This action is permanent and cannot be undone. All your data will be removed.
            </p>
            <div className="user-order-modal-actions">
              <button type="button" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="button" className="danger" onClick={handleDeleteAccount}>Delete account</button>
            </div>
          </section>
        </div>
      ) : null}
    </CustomerDashboardShell>
  );
}
