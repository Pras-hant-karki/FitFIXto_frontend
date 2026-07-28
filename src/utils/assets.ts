import { resolveAssetUrl } from "@/constants/api";

/**
 * Resolves any stored upload path to a URL the browser can load.
 *
 * Uploads are served by the backend at `/assets/...`, on a different origin to the frontend in
 * development. Several pages used to render the raw stored path (`users/abc.png`) or a
 * frontend-relative one (`/assets/users/abc.png`), both of which resolve against the Next.js
 * origin and 404 — which is why avatars and product images were blank on some screens.
 * Everything that renders an upload should go through here.
 */
export const assetUrl = (path?: string | null): string => resolveAssetUrl(path);

/** Avatar URL for a user-like record, or "" when they have no picture. */
export const avatarUrl = (user?: { profilePicture?: string | null } | null): string =>
  assetUrl(user?.profilePicture);

/** First image of a product-like record, or "" when it has none. */
export const productImageUrl = (product?: { images?: string[] | null } | null): string =>
  assetUrl(product?.images?.[0]);

/** Uppercase initial used as an avatar placeholder when no picture exists. */
export const initialOf = (value?: string | null): string =>
  (value ?? "").trim().charAt(0).toUpperCase() || "?";

export { resolveAssetUrl };
