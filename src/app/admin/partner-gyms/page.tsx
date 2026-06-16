"use client";

import { FormEvent, useState } from "react";
import { Edit2, MapPin, Plus, Power, Save, Trash2, X } from "lucide-react";

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

export default function AdminPartnerGymsPage() {
  const [gyms, setGyms] = useState<PartnerGym[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGymId, setEditingGymId] = useState<string | null>(null);
  const [form, setForm] = useState<GymFormState>(emptyGymForm);

  const openCreateForm = () => {
    setEditingGymId(null);
    setForm(emptyGymForm);
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

  return (
    <section className="admin-partner-gyms-page">
      <header className="admin-partner-gyms-header">
        <div>
          <h1>Partner Gyms</h1>
          <p>Pin and manage gyms that appear to users on Find Gyms.</p>
        </div>
        <button type="button" className="admin-create-button" onClick={openCreateForm}>
          <Plus aria-hidden="true" />
          Add Gym
        </button>
      </header>

      <div className="admin-partner-gyms-grid">
        <section className="admin-gym-map-placeholder" aria-label="Partner gyms map placeholder">
          <MapPin aria-hidden="true" />
          <h2>Map unavailable</h2>
          <p>Add a Google Maps API key to enable the interactive map.</p>
          {gyms.length ? (
            <div className="admin-gym-map-pills">
              {gyms.map((gym) => (
                <button type="button" key={gym.id}>
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
