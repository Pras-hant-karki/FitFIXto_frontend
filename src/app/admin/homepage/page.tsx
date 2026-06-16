"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ImageIcon, Plus, Save } from "lucide-react";
import { HomepageHero, fetchHomepageSettings, updateHomepageHero, uploadHomepageImage } from "@/features/homepage/api";

const defaultHero: HomepageHero = {
  eyebrow: "Built for the strong",
  title: "Equipment, trainers and gyms - under one roof.",
  subtitle: "FitFIXto powers your fitness journey from first dumbbell to full commercial setup.",
  ctaLabel: "Shop Equipment",
  ctaLink: "/shop",
  imageUrl: "/home-hero-gym.png",
};

export default function AdminHomepagePage() {
  const [hero, setHero] = useState<HomepageHero>(defaultHero);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError("");

      try {
        const settings = await fetchHomepageSettings();
        if (settings?.hero) {
          setHero(settings.hero);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load homepage settings.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleImageUpload = async () => {
    if (!selectedImage) {
      setError("Please choose an image before uploading.");
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const imageUrl = await uploadHomepageImage(selectedImage);
      setHero((current) => ({ ...current, imageUrl }));
      setSelectedImage(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      setMessage("Hero image uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload hero image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveHero = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const settings = await updateHomepageHero(hero);
      if (settings?.hero) {
        setHero(settings.hero);
      }
      setMessage("Hero banner saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save hero banner.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-homepage-page">
      <header className="admin-homepage-header">
        <h1>Homepage</h1>
        <p>Edit the hero, promotional banner, and reorder homepage sections.</p>
      </header>

      {message ? <p className="admin-products-message success">{message}</p> : null}
      {error ? <p className="admin-products-message error">{error}</p> : null}

      <article className="admin-home-card">
        <div className="admin-home-card-title">
          <ImageIcon aria-hidden="true" />
          <h2>Hero Banner</h2>
        </div>

        {isLoading ? (
          <div className="admin-products-empty">Loading hero settings...</div>
        ) : (
          <div className="admin-hero-editor">
            <form className="admin-hero-form" onSubmit={handleSaveHero}>
              <label>
                Eyebrow
                <input value={hero.eyebrow} onChange={(event) => setHero((current) => ({ ...current, eyebrow: event.target.value }))} />
              </label>
              <label>
                Title
                <input value={hero.title} onChange={(event) => setHero((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label>
                Subtitle
                <textarea value={hero.subtitle} onChange={(event) => setHero((current) => ({ ...current, subtitle: event.target.value }))} />
              </label>
              <div className="admin-hero-two-col">
                <label>
                  CTA Label
                  <input value={hero.ctaLabel} onChange={(event) => setHero((current) => ({ ...current, ctaLabel: event.target.value }))} />
                </label>
                <label>
                  CTA Link
                  <input value={hero.ctaLink} onChange={(event) => setHero((current) => ({ ...current, ctaLink: event.target.value }))} />
                </label>
              </div>
              <div className="admin-home-upload-row">
                <div className="admin-upload-field">
                  <span>Hero image</span>
                  <button type="button" className="admin-upload-drop" onClick={() => imageInputRef.current?.click()}>
                    <Plus aria-hidden="true" />
                  </button>
                  <input
                    ref={imageInputRef}
                    className="admin-hidden-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={isUploading}
                    onChange={(event) => setSelectedImage(event.target.files?.[0] || null)}
                  />
                  <small>
                    Choose files <span>{selectedImage?.name || "No file chosen"}</span>
                  </small>
                  <button type="button" className="admin-upload-picture-button" disabled={isUploading} onClick={handleImageUpload}>
                    {isUploading ? "Uploading..." : "Upload Image"}
                  </button>
                </div>
                <label>
                  Image URL
                  <input value={hero.imageUrl} onChange={(event) => setHero((current) => ({ ...current, imageUrl: event.target.value }))} />
                </label>
              </div>
              <button type="submit" className="admin-home-save-button" disabled={isSaving}>
                <Save aria-hidden="true" />
                {isSaving ? "Saving..." : "Save Hero"}
              </button>
            </form>

            <div className="admin-hero-preview" style={{ backgroundImage: `url(${hero.imageUrl || "/home-hero-gym.png"})` }}>
              <div>
                <span>{hero.eyebrow}</span>
                <h3>{hero.title}</h3>
                <p>{hero.subtitle}</p>
                <strong>{hero.ctaLabel}</strong>
              </div>
            </div>
          </div>
        )}
      </article>
    </section>
  );
}
