"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Edit2, MapPin, Plus, Power, Save, Search, Trash2, X } from "lucide-react";

type PartnerGym = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  rating: string;
  pin: string;
  locationUrl: string;
  isVisible: boolean;
};

type GymFormState = Omit<PartnerGym, "id">;

type GoogleLatLng = {
  lat: number;
  lng: number;
};

type GooglePlaceResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  url?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
};

type GoogleMapInstance = {
  addListener: (eventName: string, callback: (event: { latLng?: { lat: () => number; lng: () => number } }) => void) => void;
  fitBounds: (bounds: unknown) => void;
  getBounds: () => unknown;
  panTo: (location: GoogleLatLng) => void;
  setCenter: (location: GoogleLatLng) => void;
  setZoom: (zoom: number) => void;
};

type GoogleMarkerInstance = {
  setMap: (map: GoogleMapInstance | null) => void;
  setPosition: (location: GoogleLatLng) => void;
};

type GooglePlacesService = {
  textSearch: (
    request: { query: string; bounds?: unknown; location?: GoogleLatLng; radius?: number },
    callback: (results: GooglePlaceResult[] | null, status: string) => void
  ) => void;
};

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement, options: { center: GoogleLatLng; zoom: number; mapTypeControl: boolean; streetViewControl: boolean }) => GoogleMapInstance;
        Marker: new (options: { map: GoogleMapInstance; position: GoogleLatLng; title?: string }) => GoogleMarkerInstance;
        LatLngBounds: new () => { extend: (location: GoogleLatLng) => void };
        places: {
          PlacesService: new (map: GoogleMapInstance) => GooglePlacesService;
          PlacesServiceStatus: { OK: string };
        };
      };
    };
  }
}

const emptyGymForm: GymFormState = {
  name: "",
  address: "",
  phone: "",
  hours: "",
  rating: "",
  pin: "",
  locationUrl: "",
  isVisible: true,
};

const nepalCenter = { lat: 28.3949, lng: 84.124 };
const googleMapsApiKey =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_VITE_GOOGLE_MAPS_API_KEY ||
  process.env.VITE_GOOGLE_MAPS_API_KEY ||
  "";

const loadGoogleMapsScript = (apiKey: string) =>
  new Promise<void>((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    const existingScript = document.getElementById("fitfixto-google-maps-script") as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Google Maps.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "fitfixto-google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Google Maps."));
    document.head.appendChild(script);
  });

const formatPin = (location: GoogleLatLng) => `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;

export default function AdminPartnerGymsPage() {
  const [gyms, setGyms] = useState<PartnerGym[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGymId, setEditingGymId] = useState<string | null>(null);
  const [form, setForm] = useState<GymFormState>(emptyGymForm);
  const [mapStatus, setMapStatus] = useState(googleMapsApiKey ? "Loading map..." : "Google Maps API key missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your env to enable the map.");
  const [searchQuery, setSearchQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<GooglePlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleMarkerInstance | null>(null);
  const placesServiceRef = useRef<GooglePlacesService | null>(null);

  useEffect(() => {
    if (!googleMapsApiKey || !mapElementRef.current) {
      return;
    }

    let isMounted = true;

    loadGoogleMapsScript(googleMapsApiKey)
      .then(() => {
        if (!isMounted || !window.google || !mapElementRef.current) {
          return;
        }

        const map = new window.google.maps.Map(mapElementRef.current, {
          center: nepalCenter,
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
        });

        mapRef.current = map;
        placesServiceRef.current = new window.google.maps.places.PlacesService(map);
        setMapStatus("");

        map.addListener("click", (event) => {
          if (!event.latLng) {
            return;
          }

          const location = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          setPinOnMap(location);
          setForm((current) => ({ ...current, pin: formatPin(location) }));
          setIsFormOpen(true);
        });
      })
      .catch((error) => setMapStatus(error instanceof Error ? error.message : "Unable to load Google Maps."));

    return () => {
      isMounted = false;
    };
  }, []);

  const setPinOnMap = (location: GoogleLatLng, title?: string) => {
    if (!mapRef.current || !window.google) {
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({ map: mapRef.current, position: location, title });
    } else {
      markerRef.current.setPosition(location);
    }

    mapRef.current.panTo(location);
    mapRef.current.setZoom(15);
  };

  const openCreateForm = (prefill: Partial<GymFormState> = {}) => {
    setEditingGymId(null);
    setForm({ ...emptyGymForm, ...prefill });
    setIsFormOpen(true);
  };

  const openEditForm = (gym: PartnerGym) => {
    setEditingGymId(gym.id);
    setForm({
      name: gym.name,
      address: gym.address,
      phone: gym.phone,
      hours: gym.hours,
      rating: gym.rating,
      pin: gym.pin,
      locationUrl: gym.locationUrl,
      isVisible: gym.isVisible,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingGymId(null);
    setForm(emptyGymForm);
    setIsFormOpen(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingGymId) {
      setGyms((current) => current.map((gym) => (gym.id === editingGymId ? { ...gym, ...form } : gym)));
    } else {
      setGyms((current) => [{ id: crypto.randomUUID(), ...form }, ...current]);
    }

    closeForm();
  };

  const handleVisibilityToggle = (gymId: string) => {
    setGyms((current) => current.map((gym) => (gym.id === gymId ? { ...gym, isVisible: !gym.isVisible } : gym)));
  };

  const handleDelete = (gymId: string) => {
    setGyms((current) => current.filter((gym) => gym.id !== gymId));
  };

  const handleSearchGyms = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!placesServiceRef.current || !window.google) {
      setMapStatus("Google Maps API key missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your env to enable the map.");
      return;
    }

    const query = searchQuery.trim();
    if (!query) {
      return;
    }

    setIsSearching(true);
    setPlaceResults([]);

    placesServiceRef.current.textSearch(
      {
        query: `${query} gym Nepal`,
        bounds: mapRef.current?.getBounds(),
        location: nepalCenter,
        radius: 500000,
      },
      (results, status) => {
        setIsSearching(false);

        if (status !== window.google?.maps.places.PlacesServiceStatus.OK || !results) {
          setPlaceResults([]);
          return;
        }

        setPlaceResults(results.slice(0, 6));
      }
    );
  };

  const handleAddPlace = (place: GooglePlaceResult) => {
    const location = place.geometry?.location ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() } : nepalCenter;

    setPinOnMap(location, place.name);
    openCreateForm({
      name: place.name || "",
      address: place.formatted_address || "",
      rating: place.rating ? String(place.rating) : "",
      pin: formatPin(location),
      locationUrl: place.url || "",
    });
  };

  const handleGymPillClick = (gym: PartnerGym) => {
    const [lat, lng] = gym.pin.split(",").map((value) => Number(value.trim()));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setPinOnMap({ lat, lng }, gym.name);
    }
  };

  return (
    <section className="admin-partner-gyms-page">
      <header className="admin-partner-gyms-header">
        <div>
          <h1>Partner Gyms</h1>
          <p>Pin and manage gyms that appear to users on Find Gyms.</p>
        </div>
        <button type="button" className="admin-create-button" onClick={() => openCreateForm()}>
          <Plus aria-hidden="true" />
          Add Gym
        </button>
      </header>

      <div className="admin-partner-gyms-grid">
        <section className="admin-gym-map-shell" aria-label="Partner gyms map">
          <div className="admin-gym-map-search">
            <form onSubmit={handleSearchGyms}>
              <Search aria-hidden="true" />
              <input
                placeholder="Search gyms in Nepal..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <button type="submit" disabled={isSearching}>
                {isSearching ? "Searching" : "Search"}
              </button>
            </form>
          </div>

          <div className="admin-gym-map-canvas" ref={mapElementRef}>
            {mapStatus ? (
              <div className="admin-gym-map-placeholder">
                <MapPin aria-hidden="true" />
                <h2>Map unavailable</h2>
                <p>{mapStatus}</p>
              </div>
            ) : null}
          </div>

          {placeResults.length ? (
            <div className="admin-gym-search-results">
              {placeResults.map((place) => (
                <article key={place.place_id || place.name}>
                  <div>
                    <strong>{place.name}</strong>
                    <span>{place.formatted_address}</span>
                  </div>
                  <button type="button" onClick={() => handleAddPlace(place)}>
                    Add Gym
                  </button>
                </article>
              ))}
            </div>
          ) : null}

          {gyms.length ? (
            <div className="admin-gym-map-pills">
              {gyms.map((gym) => (
                <button type="button" key={gym.id} onClick={() => handleGymPillClick(gym)}>
                  {gym.name}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="admin-gym-list-panel">
          {isFormOpen ? (
            <form className="admin-gym-form" onSubmit={handleSubmit}>
              <div className="admin-gym-form-header">
                <h2>{editingGymId ? "Edit gym" : "New gym"}</h2>
                <button type="button" aria-label="Close gym form" onClick={closeForm}>
                  <X aria-hidden="true" />
                </button>
              </div>

              <div className="admin-gym-form-body">
                <label className="admin-gym-form-wide">
                  Name *
                  <input
                    required
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label className="admin-gym-form-wide">
                  Address *
                  <input
                    required
                    value={form.address}
                    onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  />
                </label>
                <label>
                  Phone
                  <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                </label>
                <label>
                  Hours
                  <input value={form.hours} onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))} />
                </label>
                <label>
                  Rating
                  <input
                    min="0"
                    max="5"
                    step="0.1"
                    type="number"
                    value={form.rating}
                    onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}
                  />
                </label>
                <label>
                  Pin
                  <input
                    placeholder="28.3949, 84.1240"
                    value={form.pin}
                    onChange={(event) => setForm((current) => ({ ...current, pin: event.target.value }))}
                  />
                </label>
                <label className="admin-gym-form-wide">
                  Location URL
                  <input
                    type="url"
                    value={form.locationUrl}
                    onChange={(event) => setForm((current) => ({ ...current, locationUrl: event.target.value }))}
                  />
                </label>
                <label className="admin-gym-visible-check">
                  <input
                    type="checkbox"
                    checked={form.isVisible}
                    onChange={(event) => setForm((current) => ({ ...current, isVisible: event.target.checked }))}
                  />
                  Visible to users
                </label>
              </div>

              <div className="admin-gym-form-actions">
                <button type="submit">
                  <Save aria-hidden="true" />
                  Save
                </button>
                <button type="button" onClick={closeForm}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2>{gyms.length} gyms</h2>
              {gyms.length ? (
                <div className="admin-gym-list">
                  {gyms.map((gym) => (
                    <article className="admin-gym-list-item" key={gym.id}>
                      <div className="admin-gym-thumb">
                        <MapPin aria-hidden="true" />
                      </div>
                      <div className="admin-gym-details">
                        <div>
                          <strong>{gym.name}</strong>
                          <span className={gym.isVisible ? "live" : "hidden"}>{gym.isVisible ? "LIVE" : "HIDDEN"}</span>
                        </div>
                        <p>{gym.address}</p>
                        <div className="admin-gym-actions">
                          <button type="button" onClick={() => openEditForm(gym)}>
                            <Edit2 aria-hidden="true" />
                            Edit
                          </button>
                          <button type="button" onClick={() => handleVisibilityToggle(gym.id)}>
                            <Power aria-hidden="true" />
                            {gym.isVisible ? "Hide" : "Show"}
                          </button>
                          <button type="button" onClick={() => handleDelete(gym.id)}>
                            <Trash2 aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-gym-empty-state">
                  <MapPin aria-hidden="true" />
                  <strong>No partner gyms yet</strong>
                  <p>Click Add Gym to create the first partner gym entry.</p>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
