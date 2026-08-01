"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Box, ExternalLink, GripVertical, ImageIcon, Megaphone, Plus, Save, Star, UserCog, Wrench } from "lucide-react";
import { useToast } from "@/contexts";
import {
  HomepageHero,
  HomepagePromotionalBanner,
  HomepageSectionOrderItem,
  fetchHomepageSettings,
  updateHomepageHero,
  updateHomepagePromotionalBanner,
  updateHomepageSectionOrder,
  uploadHomepageImage,
} from "@/features/homepage/api";
import { BackendProduct, fetchProducts, getProductImage } from "@/features/products";
import { BackendTrainer, fetchAdminTrainers, normalizeTrainerPhotoUrl } from "@/features/trainers";

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

const defaultSectionOrder: HomepageSectionOrderItem[] = [
  { id: "featured-products", label: "Featured Products" },
  { id: "featured-services", label: "Featured Services" },
  { id: "promotional-banner", label: "Promotional Banner" },
  { id: "featured-trainers", label: "Featured Trainers" },
];

const featuredServices = [
  { name: "Full Gym", image: "/ctabanner.png" },
  { name: "Sauna & Steam", image: "/home-hero-gym.png" },
  { name: "Equipment", image: "/home-hero-gym.png" },
];

export default function AdminHomepagePage() {
  const { toast } = useToast();
  const [hero, setHero] = useState<HomepageHero>(defaultHero);
  const [promotionalBanner, setPromotionalBanner] = useState<HomepagePromotionalBanner>(defaultPromotionalBanner);
  const [sectionOrder, setSectionOrder] = useState<HomepageSectionOrderItem[]>(defaultSectionOrder);
  const [featuredProducts, setFeaturedProducts] = useState<BackendProduct[]>([]);
  const [featuredTrainers, setFeaturedTrainers] = useState<BackendTrainer[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);

      try {
        const settings = await fetchHomepageSettings();
        if (settings?.hero) {
          setHero({ ...defaultHero, ...settings.hero });
        }
        if (settings?.promotionalBanner) {
          setPromotionalBanner({ ...defaultPromotionalBanner, ...settings.promotionalBanner });
        }
        if (settings?.sectionOrder?.length) {
          setSectionOrder(settings.sectionOrder);
        }

        const [productResponse, trainers] = await Promise.all([
          fetchProducts({ isFeatured: true, limit: 9 }),
          fetchAdminTrainers(),
        ]);

        setFeaturedProducts(productResponse?.products || []);
        setFeaturedTrainers(trainers.filter((trainer) => trainer.isFeatured));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to load homepage settings.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleImageUpload = async () => {
    if (!selectedImage) {
      toast.error("Please choose an image before uploading.");
      return;
    }

    setIsUploading(true);

    try {
      const imageUrl = await uploadHomepageImage(selectedImage);
      setHero((current) => ({ ...current, imageUrl }));
      setSelectedImage(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      toast.success("Hero image uploaded successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to upload hero image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveHero = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const settings = await updateHomepageHero(hero);
      if (settings?.hero) {
        setHero(settings.hero);
      }
      toast.success("Hero banner saved successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save hero banner.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePromotionalBanner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const settings = await updateHomepagePromotionalBanner(promotionalBanner);
      if (settings?.promotionalBanner) {
        setPromotionalBanner({ ...defaultPromotionalBanner, ...settings.promotionalBanner });
      }
      toast.success("Promotional banner saved successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save promotional banner.");
    } finally {
      setIsSaving(false);
    }
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sectionOrder.length) return;

    setSectionOrder((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const handleSaveSectionOrder = async () => {
    setIsSaving(true);

    try {
      const settings = await updateHomepageSectionOrder(sectionOrder);
      if (settings?.sectionOrder?.length) {
        setSectionOrder(settings.sectionOrder);
      }
      toast.success("Homepage section order saved successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save section order.");
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

      <article className="admin-home-card">
        <div className="admin-home-card-title">
          <ImageIcon aria-hidden="true" />
          <h2>Hero Banner</h2>
        </div>

        {isLoading ? (
          <div className="admin-products-empty">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="skeleton skeleton-text wide" style={{ height: 20 }} />
              <div className="skeleton skeleton-text mid" />
              <div className="skeleton skeleton-card" style={{ height: 120 }} />
            </div>
          </div>
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

      <div className="admin-feature-summary-grid">
        <article className="admin-feature-summary-card">
          <div className="admin-feature-summary-title">
            <Star aria-hidden="true" />
            <h2>Featured Products</h2>
            <a href="/admin/products">
              Manage <ExternalLink aria-hidden="true" />
            </a>
          </div>
          <p>{featuredProducts.length}/9 active</p>
          <div className="admin-feature-thumbs">
            {featuredProducts.slice(0, 4).map((product) => (
              <span key={product._id} style={{ backgroundImage: getProductImage(product) ? `url(${getProductImage(product)})` : undefined }}>
                {product.name}
              </span>
            ))}
            {featuredProducts.length === 0 ? <em>No featured products</em> : null}
          </div>
        </article>

        <article className="admin-feature-summary-card">
          <div className="admin-feature-summary-title">
            <UserCog aria-hidden="true" />
            <h2>Featured Trainers</h2>
            <a href="/admin/trainers">
              Manage <ExternalLink aria-hidden="true" />
            </a>
          </div>
          <p>{featuredTrainers.length}/6 active</p>
          <div className="admin-feature-thumbs">
            {featuredTrainers.slice(0, 3).map((trainer) => (
              <span
                key={trainer._id}
                style={{ backgroundImage: normalizeTrainerPhotoUrl(trainer.userId.profilePicture) ? `url(${normalizeTrainerPhotoUrl(trainer.userId.profilePicture)})` : undefined }}
              >
                {trainer.userId.firstName} {trainer.userId.lastName}
              </span>
            ))}
            {featuredTrainers.length === 0 ? <em>No featured trainers</em> : null}
          </div>
        </article>

        <article className="admin-feature-summary-card">
          <div className="admin-feature-summary-title">
            <Wrench aria-hidden="true" />
            <h2>Featured Services</h2>
            <a href="/services">
              Manage <ExternalLink aria-hidden="true" />
            </a>
          </div>
          <p>{featuredServices.length}/3 active</p>
          <div className="admin-feature-thumbs">
            {featuredServices.map((service) => (
              <span key={service.name} style={{ backgroundImage: `url(${service.image})` }}>
                {service.name}
              </span>
            ))}
          </div>
        </article>
      </div>

      <article className="admin-home-card">
        <div className="admin-home-card-title">
          <GripVertical aria-hidden="true" />
          <h2>Section Order</h2>
        </div>
        <p className="admin-section-order-help">Use the arrows to reorder how sections appear on the homepage.</p>
        <div className="admin-section-order-list">
          {sectionOrder.map((section, index) => (
            <div className="admin-section-order-item" key={section.id}>
              <GripVertical aria-hidden="true" />
              <Box aria-hidden="true" />
              <strong>{section.label}</strong>
              <span>{index + 1}</span>
              <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label={`Move ${section.label} up`}>
                <ArrowUp aria-hidden="true" />
              </button>
              <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sectionOrder.length - 1} aria-label={`Move ${section.label} down`}>
                <ArrowDown aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="admin-home-save-button" disabled={isSaving} onClick={handleSaveSectionOrder}>
          <Save aria-hidden="true" />
          {isSaving ? "Saving..." : "Save Section Order"}
        </button>
      </article>
    </section>
  );
}
