import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export type GoogleLatLng = google.maps.LatLngLiteral;
export type GoogleMapInstance = google.maps.Map;
export type GoogleMarkerInstance = google.maps.Marker;
export type GooglePlaceResult = google.maps.places.PlaceResult;
export type GooglePlacesService = google.maps.places.PlacesService;

/** The libraries every map screen in the app needs. */
export type GoogleMapsLibraries = {
  maps: google.maps.MapsLibrary;
  places: google.maps.PlacesLibrary;
  core: google.maps.CoreLibrary;
  marker: google.maps.MarkerLibrary;
};

declare global {
  interface Window {
    /** Google calls this when the API key is rejected (bad key, no billing, wrong referrer). */
    gm_authFailure?: () => void;
    __fitfixtoMapsAuthFailed?: boolean;
  }
}

export const nepalCenter: GoogleLatLng = { lat: 28.3949, lng: 84.124 };

export const googleMapsApiKey =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_VITE_GOOGLE_MAPS_API_KEY ||
  "";

/**
 * Message shown when Google rejects the API key.
 *
 * Google's own response is an opaque "This page can't load Google Maps correctly" overlay plus
 * a "For development purposes only" watermark, which says nothing about the cause. The cause is
 * always the key's configuration in Google Cloud, never the app code, so we say so explicitly.
 */
export const MAPS_AUTH_FAILURE_MESSAGE =
  "Google rejected the Maps API key. In Google Cloud Console, confirm billing is enabled for the project, that the Maps JavaScript API and Places API are both enabled, and that the key's HTTP referrer restrictions allow this site.";

export const MAPS_MISSING_KEY_MESSAGE =
  "No Google Maps API key is configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local and restart the dev server.";

/** Registered once so any map on the page learns about a rejected key. */
const installAuthFailureHook = () => {
  if (typeof window === "undefined" || window.gm_authFailure) return;

  window.gm_authFailure = () => {
    window.__fitfixtoMapsAuthFailed = true;
    window.dispatchEvent(new CustomEvent("fitfixto:maps-auth-failed"));
  };
};

export const hasMapsAuthFailed = () =>
  typeof window !== "undefined" && Boolean(window.__fitfixtoMapsAuthFailed);

let optionsApplied = false;

/**
 * Loads the Maps libraries via the official @googlemaps/js-api-loader.
 *
 * Libraries must be awaited individually rather than relying on a script `onload`: the modern
 * bootstrap loads the API asynchronously, so the script element resolves *before* the maps
 * library is attached. Constructing a map at that point is what threw
 * "window.google.maps.Map is not a constructor". `importLibrary` resolves only once the
 * requested library is genuinely ready and hands back the constructors directly, so callers
 * never read `window.google` at all.
 *
 * `setOptions` must run before the first import and only once; repeat and concurrent calls
 * are otherwise safe because the loader dedupes internally.
 */
export const loadGoogleMaps = async (apiKey: string): Promise<GoogleMapsLibraries> => {
  if (!apiKey) throw new Error(MAPS_MISSING_KEY_MESSAGE);

  installAuthFailureHook();

  if (!optionsApplied) {
    setOptions({ key: apiKey, v: "weekly" });
    optionsApplied = true;
  }

  // `Marker` ships in the marker library and `LatLngBounds` in core, so both are imported
  // alongside maps and places.
  const [maps, places, core, marker] = await Promise.all([
    importLibrary("maps"),
    importLibrary("places"),
    importLibrary("core"),
    importLibrary("marker"),
  ]);

  return { maps, places, core, marker };
};
