"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Edit2, MapPin, Plus, Power, Save, Search, Trash2, X } from "lucide-react";
import {
  createPartnerGym,
  deletePartnerGym,
  fetchPartnerGyms,
  normalizeGymImageUrl,
  updatePartnerGym,
  uploadPartnerGymImages,
  type BackendPartnerGym,
  type PartnerGymPayload,
} from "@/features/partner-gyms";
import { useToast } from "@/contexts";
import { useMapsAuthFailure } from "@/hooks";
import {
  googleMapsApiKey,
  loadGoogleMaps,
  MAPS_AUTH_FAILURE_MESSAGE,
  MAPS_MISSING_KEY_MESSAGE,
  nepalCenter,
  type GoogleLatLng,
  type GoogleMapInstance,
  type GoogleMarkerInstance,
  type GooglePlaceResult,
  type GooglePlacesService,
} from "@/lib/google-maps";

type GymFormState = {
  name: string;
  address: string;
  phone: string;
  hours: string;
  rating: string;
  pin: string;
  locationUrl: string;
  images: string[];
  isVisible: boolean;
};

const emptyGymForm: GymFormState = {
  name: "",
  address: "",
  phone: "",
  hours: "",
  rating: "",
  pin: "",
  locationUrl: "",
  images: [],
  isVisible: true,
};

const formatPin = (location: GoogleLatLng) => `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;

export default function AdminPartnerGymsPage() {
  const { toast } = useToast();
  const [gyms, setGyms] = useState<BackendPartnerGym[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGymId, setEditingGymId] = useState<string | null>(null);
  const [form, setForm] = useState<GymFormState>(emptyGymForm);
  const [mapStatus, setMapStatus] = useState(googleMapsApiKey ? "Loading map..." : MAPS_MISSING_KEY_MESSAGE);
  const mapsAuthFailed = useMapsAuthFailure();
  const [searchQuery, setSearchQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<GooglePlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleMarkerInstance | null>(null);
  const placesServiceRef = useRef<GooglePlacesService | null>(null);
  // Constructors and enums are captured from the loaded library rather than read off
  // window.google, which is undefined until the async bootstrap resolves.
  const markerFactoryRef = useRef<typeof google.maps.Marker | null>(null);
  const placesStatusOkRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchPartnerGyms()
      .then((nextGyms) => {
        if (isMounted) {
          setGyms(nextGyms);
        }
      })
      .catch((error) => {
        if (isMounted) {
          toast.error(error instanceof Error ? error.message : "Unable to load partner gyms.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!googleMapsApiKey || !mapElementRef.current) {
      return;
    }

    let isMounted = true;

    loadGoogleMaps(googleMapsApiKey)
      .then(({ maps, places, marker }) => {
        if (!isMounted || !mapElementRef.current) {
          return;
        }

        // Constructors come from the resolved library, never from window.google — the global
        // is not populated until the async bootstrap finishes.
        const map = new maps.Map(mapElementRef.current, {
          center: nepalCenter,
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
        });

        mapRef.current = map;
        markerFactoryRef.current = marker.Marker;
        placesServiceRef.current = new places.PlacesService(map);
        placesStatusOkRef.current = places.PlacesServiceStatus.OK;
        setMapStatus("");

        map.addListener("click", (event: google.maps.MapMouseEvent) => {
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
    const MarkerCtor = markerFactoryRef.current;

    if (!mapRef.current || !MarkerCtor) {
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new MarkerCtor({ map: mapRef.current, position: location, title });
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

  const openEditForm = (gym: BackendPartnerGym) => {
    setEditingGymId(gym._id);
    setForm({
      name: gym.name,
      address: gym.address,
      phone: gym.phone || "",
      hours: gym.hours || "",
      rating: typeof gym.rating === "number" ? String(gym.rating) : "",
      pin: gym.pin || "",
      locationUrl: gym.locationUrl || "",
      images: gym.images || [],
      isVisible: gym.isVisible,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingGymId(null);
    setForm(emptyGymForm);
    setIsFormOpen(false);
  };

  const toPayload = (): PartnerGymPayload => ({
    name: form.name,
    address: form.address,
    phone: form.phone,
    hours: form.hours,
    rating: form.rating ? Number(form.rating) : undefined,
    pin: form.pin,
    locationUrl: form.locationUrl,
    images: form.images,
    isVisible: form.isVisible,
  });

  const selectedFileLabel = selectedImageFiles.length
    ? selectedImageFiles.map((file) => file.name).join(", ")
    : "No file chosen";

  const handleImageSelection = (files: FileList | null) => {
    setSelectedImageFiles(files ? Array.from(files).slice(0, 5) : []);
  };

  const handleImageUpload = async () => {
    if (!selectedImageFiles.length) {
      toast.warning("Please choose 1–5 gym images before uploading.");
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrls = await uploadPartnerGymImages(selectedImageFiles);
      setForm((current) => ({ ...current, images: uploadedUrls.slice(0, 5) }));
      setSelectedImageFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success(`${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload gym images.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      if (editingGymId) {
        const updatedGym = await updatePartnerGym(editingGymId, toPayload());
        if (updatedGym) {
          setGyms((current) => current.map((gym) => (gym._id === editingGymId ? updatedGym : gym)));
        }
        toast.success("Partner gym updated.");
      } else {
        const createdGym = await createPartnerGym(toPayload());
        if (createdGym) {
          setGyms((current) => [createdGym, ...current]);
        }
        toast.success("Partner gym added.");
      }

      closeForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save partner gym.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVisibilityToggle = async (gym: BackendPartnerGym) => {
    try {
      const updatedGym = await updatePartnerGym(gym._id, { isVisible: !gym.isVisible });
      if (updatedGym) {
        setGyms((current) => current.map((currentGym) => (currentGym._id === gym._id ? updatedGym : currentGym)));
      }
      toast.success(gym.isVisible ? "Gym hidden from public." : "Gym now visible to public.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update gym visibility.");
    }
  };

  const handleDelete = async (gymId: string) => {
    try {
      await deletePartnerGym(gymId);
      setGyms((current) => current.filter((gym) => gym._id !== gymId));
      toast.success("Partner gym removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete partner gym.");
    }
  };

  const handleSearchGyms = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!placesServiceRef.current) {
      setMapStatus(googleMapsApiKey ? "The map is still loading. Try again in a moment." : MAPS_MISSING_KEY_MESSAGE);
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

        if (status !== placesStatusOkRef.current || !results) {
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

  const handleGymPillClick = (gym: BackendPartnerGym) => {
    if (!gym.pin) {
      return;
    }

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

          {/* A rejected key still renders a usable greyed-out map, so this is a banner above
              it rather than an overlay — pinning and searching keep working. */}
          {mapsAuthFailed ? (
            <p className="admin-gym-map-warning" role="status">
              <MapPin aria-hidden="true" />
              {MAPS_AUTH_FAILURE_MESSAGE}
            </p>
          ) : null}

          <div className="admin-gym-map-canvas">
            <div ref={mapElementRef} className="admin-gym-map-inner" />
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
                <button type="button" key={gym._id} onClick={() => handleGymPillClick(gym)}>
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
                <div className="admin-gym-image-upload admin-gym-form-wide">
                  <div className="admin-upload-field">
                    <span>Upload gym images</span>
                    <button
                      type="button"
                      className="admin-upload-drop"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Choose gym image files"
                    >
                      <Plus aria-hidden="true" />
                    </button>
                    <input
                      ref={fileInputRef}
                      className="admin-hidden-file-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      multiple
                      disabled={isUploading}
                      onChange={(event) => handleImageSelection(event.target.files)}
                    />
                    <small>
                      Choose files <span>{selectedFileLabel}</span>
                    </small>
                    <button
                      type="button"
                      className="admin-upload-picture-button"
                      disabled={isUploading}
                      onClick={handleImageUpload}
                    >
                      {isUploading ? "Uploading..." : "Upload Pictures"}
                    </button>
                  </div>
                  <div className="admin-gym-image-preview-grid">
                    {form.images.length ? (
                      form.images.map((image) => <img src={image} alt="Gym upload preview" key={image} />)
                    ) : (
                      <span>No uploaded images yet</span>
                    )}
                  </div>
                </div>
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
                <button type="submit" disabled={isSaving}>
                  <Save aria-hidden="true" />
                  {isSaving ? "Saving" : "Save"}
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
                    <article className="admin-gym-list-item" key={gym._id}>
                      <div className="admin-gym-thumb">
                        {normalizeGymImageUrl(gym.images?.[0]) ? (
                          <img src={normalizeGymImageUrl(gym.images?.[0])} alt={gym.name} />
                        ) : (
                          <MapPin aria-hidden="true" />
                        )}
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
                          <button type="button" onClick={() => handleVisibilityToggle(gym)}>
                            <Power aria-hidden="true" />
                            {gym.isVisible ? "Hide" : "Show"}
                          </button>
                          <button type="button" onClick={() => handleDelete(gym._id)}>
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
