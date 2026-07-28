import { deleteCookie, readCookie, writeCookie } from "./cookies";

/**
 * Cookie-backed session store.
 *
 * Why cookies rather than localStorage: they carry a real expiry, so a session dies on its
 * own schedule instead of lingering until someone clears storage.
 *
 * Two layers of protection guard the stored role:
 *
 *  1. Local (instant, no network). The signed envelope is cross-checked against the claims
 *     inside the JWT, against the cached user snapshot, and against the exact values this
 *     tab last wrote. Editing any cookie in devtools trips one of these within a second.
 *  2. Server (authoritative). The envelope is HMAC-signed with a server-only secret and
 *     bound to one access token, so a forged cookie cannot survive a single API call —
 *     the backend answers 401 SESSION_TAMPERED.
 *
 * Layer 1 exists purely so the UI reacts immediately; layer 2 is what actually enforces it.
 */

export const COOKIE_KEYS = {
  accessToken: "ff_at",
  refreshToken: "ff_rt",
  sessionState: "ff_ss",
  sessionSignature: "ff_sg",
  user: "ff_usr",
  remember: "ff_rm",
} as const;

const ALL_COOKIE_KEYS = Object.values(COOKIE_KEYS);

/** Fallback lifetime when the server did not supply an explicit expiry. */
const DEFAULT_MAX_AGE_SECONDS = 20 * 24 * 60 * 60;

export type SessionRole = "customer" | "trainer" | "admin";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: SessionRole | string;
  profilePicture?: string | null;
  bio?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SessionEnvelope = {
  state: string;
  signature: string;
  expiresAt: number;
  role?: string;
};

export type SessionTokens = {
  accessToken: string;
  refreshToken?: string;
};

type DecodedState = {
  uid: string;
  role: string;
  email: string;
  tid: string;
  exp: number;
};

type Snapshot = Record<string, string | null>;

export type StoredSession = {
  user: SessionUser;
  role: string;
  accessToken: string;
  refreshToken?: string;
  envelope: SessionEnvelope;
  expiresAt: number;
  remember: boolean;
};

const decodeBase64Url = (value: string): string | null => {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
  } catch {
    return null;
  }
};

/** Reads JWT claims without verifying the signature — verification is the server's job. */
export const decodeJwtClaims = (
  token: string
): { userId?: string; email?: string; role?: string; exp?: number } | null => {
  const segments = token.split(".");
  if (segments.length !== 3) return null;

  const payload = decodeBase64Url(segments[1]);
  if (!payload) return null;

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

const decodeState = (state: string): DecodedState | null => {
  const raw = decodeBase64Url(state);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as DecodedState;
    if (typeof parsed?.uid !== "string" || typeof parsed?.role !== "string") return null;
    if (typeof parsed?.email !== "string" || typeof parsed?.exp !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

type TamperListener = (reason: string) => void;

class SessionStore {
  /** Exact cookie values this tab last wrote — any drift means something edited them. */
  private snapshot: Snapshot | null = null;
  private tamperListeners = new Set<TamperListener>();
  private watching = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private tamperReported = false;

  private captureSnapshot(): void {
    const next: Snapshot = {};
    for (const key of ALL_COOKIE_KEYS) next[key] = readCookie(key);
    this.snapshot = next;
  }

  onTamper(listener: TamperListener): () => void {
    this.tamperListeners.add(listener);
    return () => this.tamperListeners.delete(listener);
  }

  private reportTamper(reason: string): void {
    if (this.tamperReported) return;
    this.tamperReported = true;

    this.clear();
    this.tamperListeners.forEach((listener) => listener(reason));
  }

  save(params: {
    user: SessionUser;
    tokens: SessionTokens;
    envelope: SessionEnvelope;
    remember: boolean;
  }): StoredSession {
    const { user, tokens, envelope, remember } = params;

    const expiresAt =
      typeof envelope.expiresAt === "number" && envelope.expiresAt > Date.now()
        ? envelope.expiresAt
        : Date.now() + DEFAULT_MAX_AGE_SECONDS * 1000;

    // "Remember me" persists to the cookie expiry; otherwise the session dies with the browser.
    const maxAgeSeconds = remember
      ? Math.max(1, Math.floor((expiresAt - Date.now()) / 1000))
      : undefined;
    const options = { maxAgeSeconds };

    writeCookie(COOKIE_KEYS.accessToken, tokens.accessToken, options);
    if (tokens.refreshToken) {
      writeCookie(COOKIE_KEYS.refreshToken, tokens.refreshToken, options);
    }
    writeCookie(COOKIE_KEYS.sessionState, envelope.state, options);
    writeCookie(COOKIE_KEYS.sessionSignature, envelope.signature, options);
    writeCookie(COOKIE_KEYS.user, JSON.stringify(user), options);
    writeCookie(COOKIE_KEYS.remember, remember ? "1" : "0", options);

    this.tamperReported = false;
    this.captureSnapshot();

    return {
      user,
      role: String(user.role),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      envelope,
      expiresAt,
      remember,
    };
  }

  /** Rotates tokens after a refresh without disturbing the rest of the session. */
  updateTokens(tokens: SessionTokens, envelope: SessionEnvelope): void {
    const current = this.read();
    if (!current) return;

    this.save({
      user: current.user,
      tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken ?? current.refreshToken },
      envelope,
      remember: current.remember,
    });
  }

  /** Updates the cached profile without touching credentials. */
  updateUser(user: SessionUser): void {
    const current = this.read();
    if (!current) return;

    this.save({
      user,
      tokens: { accessToken: current.accessToken, refreshToken: current.refreshToken },
      envelope: current.envelope,
      remember: current.remember,
    });
  }

  /**
   * Returns the stored session, or null when absent, expired or inconsistent.
   * Any inconsistency also triggers the tamper listeners.
   */
  read(): StoredSession | null {
    const accessToken = readCookie(COOKIE_KEYS.accessToken);
    const state = readCookie(COOKIE_KEYS.sessionState);
    const signature = readCookie(COOKIE_KEYS.sessionSignature);
    const rawUser = readCookie(COOKIE_KEYS.user);

    // No session at all is a normal signed-out state, not tampering.
    if (!accessToken && !state && !signature && !rawUser) return null;

    if (!accessToken || !state || !signature || !rawUser) {
      this.reportTamper("Session cookies are incomplete.");
      return null;
    }

    const decodedState = decodeState(state);
    if (!decodedState) {
      this.reportTamper("Session cookie could not be decoded.");
      return null;
    }

    if (decodedState.exp <= Date.now()) {
      this.clear();
      return null;
    }

    let user: SessionUser;
    try {
      user = JSON.parse(rawUser) as SessionUser;
    } catch {
      this.reportTamper("Stored profile could not be decoded.");
      return null;
    }

    // The signed envelope is the reference. The user snapshot and the JWT must agree with it.
    if (user?.id !== decodedState.uid || user?.email !== decodedState.email || String(user?.role) !== decodedState.role) {
      this.reportTamper("Stored profile does not match the signed session.");
      return null;
    }

    const claims = decodeJwtClaims(accessToken);
    if (!claims) {
      this.reportTamper("Access token is malformed.");
      return null;
    }

    if (claims.userId !== decodedState.uid || claims.role !== decodedState.role || claims.email !== decodedState.email) {
      this.reportTamper("Access token does not match the signed session.");
      return null;
    }

    if (typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) {
      // Expired access tokens are recoverable through the refresh flow.
      return {
        user,
        role: decodedState.role,
        accessToken,
        refreshToken: readCookie(COOKIE_KEYS.refreshToken) ?? undefined,
        envelope: { state, signature, expiresAt: decodedState.exp, role: decodedState.role },
        expiresAt: decodedState.exp,
        remember: readCookie(COOKIE_KEYS.remember) === "1",
      };
    }

    return {
      user,
      role: decodedState.role,
      accessToken,
      refreshToken: readCookie(COOKIE_KEYS.refreshToken) ?? undefined,
      envelope: { state, signature, expiresAt: decodedState.exp, role: decodedState.role },
      expiresAt: decodedState.exp,
      remember: readCookie(COOKIE_KEYS.remember) === "1",
    };
  }

  /** Fast path used for first-paint rendering — no parsing beyond the signed envelope. */
  getRole(): string | null {
    const state = readCookie(COOKIE_KEYS.sessionState);
    if (!state) return null;

    const decoded = decodeState(state);
    if (!decoded || decoded.exp <= Date.now()) return null;

    return decoded.role;
  }

  getAccessToken(): string | null {
    return readCookie(COOKIE_KEYS.accessToken);
  }

  getRefreshToken(): string | null {
    return readCookie(COOKIE_KEYS.refreshToken);
  }

  getIntegrityHeaders(): Record<string, string> {
    const state = readCookie(COOKIE_KEYS.sessionState);
    const signature = readCookie(COOKIE_KEYS.sessionSignature);

    if (!state || !signature) return {};

    return { "x-session-state": state, "x-session-sig": signature };
  }

  clear(): void {
    for (const key of ALL_COOKIE_KEYS) deleteCookie(key);
    this.snapshot = null;
  }

  /** Allows a fresh sign-in after a tamper-triggered logout. */
  resetTamperFlag(): void {
    this.tamperReported = false;
  }

  /**
   * Watches the cookies for outside edits. Polls once a second and also re-checks whenever
   * the tab regains focus, so a devtools edit is caught almost immediately.
   */
  startWatching(): () => void {
    if (typeof window === "undefined" || this.watching) return () => undefined;

    this.watching = true;
    if (!this.snapshot) this.captureSnapshot();

    const verify = () => {
      const previous = this.snapshot;
      if (!previous) return;

      // Compare against exactly what this tab last wrote.
      for (const key of ALL_COOKIE_KEYS) {
        if (readCookie(key) !== previous[key]) {
          this.reportTamper("A session cookie was modified.");
          return;
        }
      }

      // Cheap consistency re-check catches edits made before this tab took its snapshot.
      this.read();
    };

    this.pollTimer = setInterval(verify, 1000);
    window.addEventListener("focus", verify);
    document.addEventListener("visibilitychange", verify);

    return () => {
      this.watching = false;
      if (this.pollTimer) clearInterval(this.pollTimer);
      this.pollTimer = null;
      window.removeEventListener("focus", verify);
      document.removeEventListener("visibilitychange", verify);
    };
  }
}

export const sessionStore = new SessionStore();
