"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useToast } from "@/contexts";

const NOTIF_KEY = "fitfixto_notifications";
const PREF_KEY = "fitfixto_preferences";
const PRIVACY_KEY = "fitfixto_privacy";

const DEFAULT_NOTIF = { orderUpdates: true, promotions: true, bookingReminders: true, smsAlerts: false, pushNotifications: true };
const DEFAULT_PREF = { language: "", currency: "", units: "metric" as "metric" | "imperial" };
const DEFAULT_PRIVACY = { publicProfile: false, showActivity: true, personalizedRecs: true };

const load = <T,>(key: string, def: T): T => {
  if (typeof window === "undefined") return def;
  try { const r = localStorage.getItem(key); return r ? { ...def, ...JSON.parse(r) } : def; } catch { return def; }
};
const save = (key: string, val: unknown) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

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

export default function AdminSettingsPage() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notif, setNotif] = useState(DEFAULT_NOTIF);
  const [pref, setPref] = useState(DEFAULT_PREF);
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    setTheme(stored ?? "light");
    setNotif(load(NOTIF_KEY, DEFAULT_NOTIF));
    setPref(load(PREF_KEY, DEFAULT_PREF));
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

  const updatePref = (patch: Partial<typeof DEFAULT_PREF>) => {
    const next = { ...pref, ...patch };
    setPref(next);
    save(PREF_KEY, next);
  };

  const handleLogout = () => { logout(); router.push("/admin/login"); };

  const handleDeleteAccount = () => {
    toast.info("To delete this account, please contact the system administrator.");
    setShowDeleteModal(false);
  };

  return (
    <section className="admin-orders-page">
      <header className="admin-orders-header">
        <h1>Settings</h1>
        <p>Manage notifications, preferences, privacy and your account.</p>
      </header>

      <div className="settings-page" style={{ marginTop: 0 }}>
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
              <select value={pref.language} onChange={(e) => updatePref({ language: e.target.value })} className="settings-pref-select">
                <option value="">English (default)</option>
                <option value="ne">Nepali</option>
                <option value="hi">Hindi</option>
              </select>
            </label>
            <label className="settings-pref-label">
              Currency
              <select value={pref.currency} onChange={(e) => updatePref({ currency: e.target.value })} className="settings-pref-select">
                <option value="">NPR (default)</option>
                <option value="USD">USD</option>
                <option value="INR">INR</option>
              </select>
            </label>
          </div>
          <div style={{ marginTop: 16 }}>
            <strong className="settings-pref-label" style={{ display: "block", marginBottom: 8 }}>Units</strong>
            <div className="settings-units-btns">
              <button type="button" className={`settings-unit-btn${pref.units === "metric" ? " active" : ""}`} onClick={() => updatePref({ units: "metric" })}>Metric</button>
              <button type="button" className={`settings-unit-btn${pref.units === "imperial" ? " active" : ""}`} onClick={() => updatePref({ units: "imperial" })}>Imperial</button>
            </div>
          </div>
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
              This action is permanent and cannot be undone. All admin access will be revoked.
            </p>
            <div className="user-order-modal-actions">
              <button type="button" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="button" className="danger" onClick={handleDeleteAccount}>Delete account</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
