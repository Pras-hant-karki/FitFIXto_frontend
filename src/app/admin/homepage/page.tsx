"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ImageIcon, Megaphone, Plus, Save } from "lucide-react";
import {
  HomepageHero,
  HomepagePromotionalBanner,
  fetchHomepageSettings,
  updateHomepageHero,
  updateHomepagePromotionalBanner,
  uploadHomepageImage,
} from "@/features/homepage/api";

const defaultHero: HomepageHero = {
  eyebrow: "",
  title: "Built for Strength",
  subtitle: "Premium equipment, expert installation, and professional trainers for serious results.",
  ctaLabel: "Shop Equipment",
  ctaLink: "#shop",
  imageUrl: "/home-hero-gym.png",
  eyebrowFontSize: 14,
  titleFontSize: 72,
  subtitleFontSize: 24,
  ctaFontSize: 18,
};

const defaultPromotionalBanner: HomepagePromotionalBanner = {
  text: "Free shipping inside Kathmandu Valley over Npr 5,000",
  link: "/shop",
  isVisible: true,
  fontSize: 16,
};

const fontSizeOptions = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

export default function AdminHomepagePage() {
  const [hero, setHero] = useState<HomepageHero>(defaultHero);
  const [promotionalBanner, setPromotionalBanner] = useState<HomepagePromotionalBanner>(defaultPromotionalBanner);
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
          setHero({ ...defaultHero, ...settings.hero });
        }
        if (settings?.promotionalBanner) {
          setPromotionalBanner({ ...defaultPromotionalBanner, ...settings.promotionalBanner });
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

  const handleSavePromotionalBanner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const settings = await updateHomepagePromotionalBanner(promotionalBanner);
      if (settings?.promotionalBanner) {
        setPromotionalBanner({ ...defaultPromotionalBanner, ...settings.promotionalBanner });
      }
      setMessage("Promotional banner saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save promotional banner.");
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
              <div className="admin-home-field-with-size">
                <label>
                  Eyebrow
                  <input value={hero.eyebrow} onChange={(event) => setHero((current) => ({ ...current, eyebrow: event.target.value }))} />
                </label>
                <label>
                  Font size
                  <select value={hero.eyebrowFontSize} onChange={(event) => setHero((current) => ({ ...current, eyebrowFontSize: Number(event.target.value) }))}>
                    {fontSizeOptions.map((size) => (
                      <option value={size} key={size}>{size}px</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="admin-home-field-with-size">
                <label>
                  Title
                  <input value={hero.title} onChange={(event) => setHero((current) => ({ ...current, title: event.target.value }))} />
                </label>
                <label>
                  Font size
                  <select value={hero.titleFontSize} onChange={(event) => setHero((current) => ({ ...current, titleFontSize: Number(event.target.value) }))}>
                    {fontSizeOptions.map((size) => (
                      <option value={size} key={size}>{size}px</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="admin-home-field-with-size">
                <label>
                  Subtitle
                  <textarea value={hero.subtitle} onChange={(event) => setHero((current) => ({ ...current, subtitle: event.target.value }))} />
                </label>
                <label>
                  Font size
                  <select value={hero.subtitleFontSize} onChange={(event) => setHero((current) => ({ ...current, subtitleFontSize: Number(event.target.value) }))}>
                    {fontSizeOptions.map((size) => (
                      <option value={size} key={size}>{size}px</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="admin-hero-two-col">
                <div className="admin-home-field-with-size">
                  <label>
                    CTA Label
                    <input value={hero.ctaLabel} onChange={(event) => setHero((current) => ({ ...current, ctaLabel: event.target.value }))} />
                  </label>
                  <label>
                    Size
                    <select value={hero.ctaFontSize} onChange={(event) => setHero((current) => ({ ...current, ctaFontSize: Number(event.target.value) }))}>
                      {fontSizeOptions.map((size) => (
                        <option value={size} key={size}>{size}px</option>
                      ))}
                    </select>
                  </label>
                </div>
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
                {hero.eyebrow ? <span style={{ fontSize: hero.eyebrowFontSize }}>{hero.eyebrow}</span> : null}
                <h3 style={{ fontSize: hero.titleFontSize }}>{hero.title || hero.eyebrow}</h3>
                <p style={{ fontSize: hero.subtitleFontSize }}>{hero.subtitle}</p>
                <strong style={{ fontSize: hero.ctaFontSize }}>{hero.ctaLabel}</strong>
              </div>
            </div>
          </div>
        )}
      </article>

      <article className="admin-home-card">
        <div className="admin-home-card-title">
          <Megaphone aria-hidden="true" />
          <h2>Promotional Banner</h2>
        </div>

        <form className="admin-promo-form" onSubmit={handleSavePromotionalBanner}>
          <div className="admin-home-field-with-size">
            <label>
              Banner Text
              <input value={promotionalBanner.text} onChange={(event) => setPromotionalBanner((current) => ({ ...current, text: event.target.value }))} />
            </label>
            <label>
              Font size
              <select value={promotionalBanner.fontSize} onChange={(event) => setPromotionalBanner((current) => ({ ...current, fontSize: Number(event.target.value) }))}>
                {fontSizeOptions.map((size) => (
                  <option value={size} key={size}>{size}px</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Link
            <input value={promotionalBanner.link} onChange={(event) => setPromotionalBanner((current) => ({ ...current, link: event.target.value }))} />
          </label>
          <label className="admin-promo-toggle">
            <input
              type="checkbox"
              checked={promotionalBanner.isVisible}
              onChange={(event) => setPromotionalBanner((current) => ({ ...current, isVisible: event.target.checked }))}
            />
            Show
          </label>
          <button type="submit" className="admin-home-save-button" disabled={isSaving}>
            <Save aria-hidden="true" />
            {isSaving ? "Saving..." : "Save Banner"}
          </button>
          <div className="admin-promo-preview" style={{ fontSize: promotionalBanner.fontSize }}>
            {promotionalBanner.isVisible ? promotionalBanner.text : "Banner hidden"}
          </div>
        </form>
      </article>
    </section>
  );
}
