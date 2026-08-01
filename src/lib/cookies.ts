/**
 * Minimal document.cookie helpers.
 *
 * Everything the app stores client-side goes through here so expiry and flags stay
 * consistent. Values are URI-encoded because cookie values cannot contain `;` or `,`.
 */

export type CookieOptions = {
  /** Lifetime in seconds. Omit for a browser-session cookie (cleared when the browser closes). */
  maxAgeSeconds?: number;
};

const isBrowser = () => typeof document !== "undefined";

export const readCookie = (name: string): string | null => {
  if (!isBrowser()) return null;

  const prefix = `${encodeURIComponent(name)}=`;

  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) {
      try {
        return decodeURIComponent(part.slice(prefix.length));
      } catch {
        return null;
      }
    }
  }

  return null;
};

export const writeCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  if (!isBrowser()) return;

  const segments = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "path=/",
    "SameSite=Lax",
  ];

  if (typeof options.maxAgeSeconds === "number") {
    // Both are sent: Max-Age wins in modern browsers, Expires covers older ones.
    segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`);
    segments.push(`Expires=${new Date(Date.now() + options.maxAgeSeconds * 1000).toUTCString()}`);
  }

  if (window.location.protocol === "https:") {
    segments.push("Secure");
  }

  document.cookie = segments.join("; ");
};

export const deleteCookie = (name: string): void => {
  if (!isBrowser()) return;

  document.cookie = `${encodeURIComponent(name)}=; path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};
