"use client";

import { CSSProperties, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Edit2, Package, Plus, Search, Shield, Trash2, X, Zap } from "lucide-react";
import { useToast } from "@/contexts";
import {
  Bundle,
  DiscountData,
  DiscountProduct,
  createBundle,
  deleteBundle,
  fetchAdminDiscounts,
  saveBestPrice,
  saveFlashSale,
  saveRefundGuarantee,
  updateBundle,
} from "@/features/discounts";
import { BackendProduct, fetchProducts, resolveProductImageUrl, uploadProductImages } from "@/features/products";

// ── helpers ────────────────────────────────────────────────────────────────

function productThumb(p: BackendProduct | DiscountProduct) {
  const img = (p as BackendProduct).images?.[0] ?? (p as DiscountProduct).images?.[0] ?? "";
  return resolveProductImageUrl(img) || "/placeholder.png";
}

const idOf = (p: DiscountProduct | string) => (typeof p === "string" ? p : p._id);

// ── Product dropdown picker ────────────────────────────────────────────────

function ProductPicker({
  all,
  selected,
  onChange,
  placeholder = "None selected (applies to all products)",
}: {
  all: BackendProduct[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const calcStyle = useCallback(() => {
    if (!toggleRef.current) return;
    const rect = toggleRef.current.getBoundingClientRect();
    setPanelStyle({ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const reCalc = () => calcStyle();
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", reCalc, true);
    window.addEventListener("resize", reCalc);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", reCalc, true);
      window.removeEventListener("resize", reCalc);
    };
  }, [open, calcStyle]);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const filtered = all.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const btnLabel =
    selected.length === 0
      ? placeholder
      : `${selected.length} product${selected.length > 1 ? "s" : ""} selected`;

  if (all.length === 0) {
    return (
      <p className="dsc-no-products">
        No products yet.{" "}
        <a href="/admin/products">Add products</a> first.
      </p>
    );
  }

  return (
    <div className="dsc-picker" ref={containerRef}>
      <button
        ref={toggleRef}
        type="button"
        className={`dsc-picker-toggle${open ? " open" : ""}${selected.length > 0 ? " has-value" : ""}`}
        onClick={() => { if (open) { setOpen(false); } else { calcStyle(); setSearch(""); setOpen(true); } }}
      >
        <span>{btnLabel}</span>
        <ChevronDown size={14} className={open ? "rotated" : ""} />
      </button>

      {open && (
        <div className="dsc-picker-panel" style={panelStyle} onWheel={(e) => e.stopPropagation()}>
          <div className="dsc-picker-search">
            <Search size={13} />
            <input
              autoFocus
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="dsc-picker-list">
            {filtered.length === 0 ? (
              <p className="dsc-picker-empty">No matching products.</p>
            ) : (
              filtered.map((p) => {
                const on = selected.includes(p._id);
                return (
                  <label key={p._id} className={`dsc-picker-item${on ? " on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(p._id)}
                    />
                    <span>{p.name}</span>
                  </label>
                );
              })
            )}
          </div>

          {selected.length > 0 && (
            <button type="button" className="dsc-picker-clear" onClick={() => onChange([])}>
              Clear selection
            </button>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="dsc-picker-tags">
          {selected.map((id) => {
            const p = all.find((x) => x._id === id);
            if (!p) return null;
            return (
              <span key={id} className="dsc-picker-tag">
                {p.name}
                <button
                  type="button"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => toggle(id)}
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Flash Sale ─────────────────────────────────────────────────────────────

function FlashSaleCard({
  data,
  allProducts,
  onSaved,
}: {
  data: DiscountData;
  allProducts: BackendProduct[];
  onSaved: () => void;
}) {
  const fs = data.flashSale;
  const [title, setTitle] = useState(fs?.title ?? "");
  const [pct, setPct] = useState(String(fs?.discountPercentage ?? ""));
  const [endsAt, setEndsAt] = useState(fs?.endsAt ? fs.endsAt.slice(0, 16) : "");
  const [isActive, setIsActive] = useState(fs?.isActive ?? false);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    (fs?.productIds ?? []).map(idOf)
  );
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveFlashSale({
        title: title.trim(),
        discountPercentage: Number(pct) || 0,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        productIds: selectedIds,
        isActive,
      });
      toast.success("Saved.");
      onSaved();
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dsc-card">
      <div className="dsc-card-head">
        <span className="dsc-icon dsc-icon--red"><Zap size={16} /></span>
        <div className="dsc-card-titles">
          <h2>Flash Sale</h2>
          <p>Live now — highlighted on the homepage.</p>
        </div>
        <button
          type="button"
          className={`dsc-active-badge${isActive ? " on" : ""}`}
          onClick={() => setIsActive((v) => !v)}
        >
          {isActive ? "Active" : "Inactive"}
        </button>
      </div>

      <form className="dsc-card-body" onSubmit={handleSave}>
        <div className="dsc-row">
          <div className="dsc-field dsc-field--grow">
            <label>Title</label>
            <input
              placeholder="e.g. Supplement Flash Sale"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="dsc-field dsc-field--sm">
            <label>Discount %</label>
            <input
              type="number"
              min={0}
              max={99}
              placeholder="20"
              value={pct}
              onChange={(e) => setPct(e.target.value)}
            />
          </div>
          <div className="dsc-field">
            <label>Ends at</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        </div>

        <div className="dsc-field">
          <label className="dsc-sublabel">
            Products on sale{" "}
            <span className="dsc-sublabel-note">(none selected = all products)</span>
          </label>
          <ProductPicker
            all={allProducts}
            selected={selectedIds}
            onChange={setSelectedIds}
            placeholder="None selected — applies to all products"
          />
        </div>

        <div className="dsc-card-foot">
          <button type="submit" className="dsc-btn dsc-btn--primary" disabled={saving}>
            {saving ? "Saving…" : "Save Flash Sale"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Bundle Offers ──────────────────────────────────────────────────────────

interface BundleForm {
  title: string;
  description: string;
  image: string;
  discountPercentage: string;
  productIds: string[];
  isActive: boolean;
}

const emptyBundleForm: BundleForm = {
  title: "",
  description: "",
  image: "",
  discountPercentage: "",
  productIds: [],
  isActive: true,
};

function BundleCard({ data, allProducts, onSaved }: { data: DiscountData; allProducts: BackendProduct[]; onSaved: () => void }) {
  const [bundles, setBundles] = useState<Bundle[]>(data.bundles ?? []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Bundle | null>(null);
  const [form, setForm] = useState<BundleForm>(emptyBundleForm);
  const [saving, setSaving] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [formErr, setFormErr] = useState("");

  useEffect(() => { setBundles(data.bundles ?? []); }, [data.bundles]);

  const openCreate = () => { setEditing(null); setForm(emptyBundleForm); setFormErr(""); setFormOpen(true); };
  const openEdit = (b: Bundle) => {
    setEditing(b);
    setForm({
      title: b.title,
      description: b.description ?? "",
      image: b.image ? resolveProductImageUrl(b.image) : "",
      discountPercentage: String(b.discountPercentage),
      productIds: b.productIds.map((p) => p._id),
      isActive: b.isActive,
    });
    setFormErr("");
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    try {
      const urls = await uploadProductImages([file]);
      if (urls[0]) setForm((f) => ({ ...f, image: urls[0] }));
    } catch { setFormErr("Image upload failed."); }
    finally { setImgUploading(false); e.target.value = ""; }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (form.productIds.length < 2) { setFormErr("Select at least 2 products."); return; }
    setSaving(true);
    setFormErr("");
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        image: form.image || undefined,
        discountPercentage: Number(form.discountPercentage),
        productIds: form.productIds,
        isActive: form.isActive,
      };
      if (editing) {
        const updated = await updateBundle(editing._id, payload);
        if (updated) setBundles((prev) => prev.map((b) => b._id === editing._id ? updated : b));
      } else {
        const created = await createBundle(payload as Parameters<typeof createBundle>[0]);
        if (created) setBundles((prev) => [...prev, created]);
      }
      closeForm();
      onSaved();
    } catch { setFormErr("Failed to save."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bundle?")) return;
    try { await deleteBundle(id); setBundles((prev) => prev.filter((b) => b._id !== id)); onSaved(); } catch {}
  };

  return (
    <div className="dsc-card">
      <div className="dsc-card-head">
        <span className="dsc-icon dsc-icon--blue"><Package size={16} /></span>
        <div className="dsc-card-titles">
          <h2>Bundle Offers</h2>
          <p>
            {bundles.length} bundle{bundles.length !== 1 ? "s" : ""} — discounts auto-apply at checkout.
          </p>
        </div>
        <button type="button" className="dsc-btn dsc-btn--primary dsc-btn--sm" onClick={openCreate}>
          <Plus size={13} />
          Create Bundle
        </button>
      </div>

      {bundles.length > 0 && (
        <div className="dsc-card-body">
          <div className="dsc-bundle-grid">
            {bundles.map((b) => {
              const names = b.productIds.map((p) => p.name).join(" + ");
              const thumb = b.image
                ? resolveProductImageUrl(b.image)
                : productThumb(b.productIds[0]);
              return (
                <div key={b._id} className={`dsc-bundle${!b.isActive ? " dsc-bundle--inactive" : ""}`}>
                  <div className="dsc-bundle-thumb-single">
                    <img src={thumb} alt={b.title} />
                  </div>
                  <div className="dsc-bundle-info">
                    <div className="dsc-bundle-row">
                      <strong>{b.title}</strong>
                      <span className="dsc-pct-badge">-{b.discountPercentage}%</span>
                    </div>
                    <p className="dsc-bundle-names">{names}</p>
                    <div className="dsc-bundle-actions">
                      <button type="button" onClick={() => openEdit(b)}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(b._id)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {formOpen && (
        <div className="dsc-overlay" onClick={closeForm}>
          <div className="dsc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dsc-modal-head">
              <h3>{editing ? "Edit Bundle" : "New Bundle"}</h3>
              <button type="button" className="dsc-modal-close" onClick={closeForm}><X size={16} /></button>
            </div>
            <form className="dsc-modal-body" onSubmit={handleSave}>
              <div className="dsc-field">
                <label>Title *</label>
                <input required placeholder="e.g. Starter Home Gym Bundle" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="dsc-field">
                <label>Description</label>
                <textarea rows={2} placeholder="Optional description" value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="dsc-field">
                <label>Bundle Image <span className="dsc-sublabel-note">(marketing photo for this bundle)</span></label>
                <div className="dsc-bundle-img-upload">
                  {form.image ? (
                    <div className="dsc-bundle-img-preview">
                      <img src={form.image} alt="Bundle preview" />
                      <button type="button" className="dsc-bundle-img-remove" onClick={() => setForm((f) => ({ ...f, image: "" }))}>
                        <X size={12} /> Remove
                      </button>
                    </div>
                  ) : (
                    <label className={`dsc-bundle-img-drop${imgUploading ? " uploading" : ""}`}>
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={imgUploading} />
                      <Package size={20} />
                      <span>{imgUploading ? "Uploading…" : "Click to upload image"}</span>
                    </label>
                  )}
                </div>
              </div>
              <div className="dsc-row">
                <div className="dsc-field dsc-field--sm">
                  <label>Discount % *</label>
                  <input required type="number" min={1} max={99} placeholder="15" value={form.discountPercentage}
                    onChange={(e) => setForm((f) => ({ ...f, discountPercentage: e.target.value }))} />
                </div>
                <div className="dsc-field dsc-field--grow">
                  <label>Status</label>
                  <label className="dsc-toggle">
                    <input type="checkbox" checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                    <span className="dsc-toggle-track"><span className="dsc-toggle-thumb" /></span>
                    <span>{form.isActive ? "Active" : "Inactive"}</span>
                  </label>
                </div>
              </div>
              <div className="dsc-field">
                <label className="dsc-sublabel">
                  Products *{" "}
                  <span className="dsc-sublabel-note">({form.productIds.length} selected, min 2)</span>
                </label>
                <ProductPicker
                  all={allProducts}
                  selected={form.productIds}
                  onChange={(ids) => setForm((f) => ({ ...f, productIds: ids }))}
                  placeholder="Select at least 2 products…"
                />
              </div>
              {formErr && <p className="dsc-err">{formErr}</p>}
              <div className="dsc-modal-foot">
                <button type="button" className="dsc-btn dsc-btn--ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="dsc-btn dsc-btn--primary" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Update Bundle" : "Create Bundle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Best-Price Labels ──────────────────────────────────────────────────────

function BestPriceCard({ data, allProducts, onSaved }: { data: DiscountData; allProducts: BackendProduct[]; onSaved: () => void }) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    (data.bestPriceProductIds ?? []).map(idOf)
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await saveBestPrice(selectedIds); toast.success("Saved."); onSaved(); }
    catch { toast.error("Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <div className="dsc-card">
      <div className="dsc-card-head">
        <span className="dsc-icon dsc-icon--gold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        </span>
        <div className="dsc-card-titles">
          <h2>Best-Price Labels</h2>
          <p>{selectedIds.length} product{selectedIds.length !== 1 ? "s" : ""} flagged.</p>
        </div>
      </div>
      <div className="dsc-card-body">
        <div className="dsc-field">
          <label className="dsc-sublabel">Flag products as best-price</label>
          <ProductPicker
            all={allProducts}
            selected={selectedIds}
            onChange={setSelectedIds}
            placeholder="Select products to flag…"
          />
        </div>
        <div className="dsc-card-foot">
          <button type="button" className="dsc-btn dsc-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Labels"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Refund Guarantee ───────────────────────────────────────────────────────

const DEFAULT_REFUND_TEXT =
  "10-day money-back guarantee. If you're not fully satisfied, return any item within 10 days for a full refund. Refund process might take 3-6 business days";

function RefundCard({ data, onSaved }: { data: DiscountData; onSaved: () => void }) {
  const { toast } = useToast();
  const [text, setText] = useState(data.refundGuarantee || DEFAULT_REFUND_TEXT);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await saveRefundGuarantee(text.trim()); toast.success("Saved."); onSaved(); }
    catch { toast.error("Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <div className="dsc-card">
      <div className="dsc-card-head">
        <span className="dsc-icon dsc-icon--green"><Shield size={16} /></span>
        <div className="dsc-card-titles">
          <h2>Refund Guarantee</h2>
          <p>Shown to customers during checkout.</p>
        </div>
      </div>
      <form className="dsc-card-body" onSubmit={handleSave}>
        <div className="dsc-field">
          <textarea
            rows={4}
            maxLength={500}
            placeholder="e.g. 30-day hassle-free returns on all products."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="dsc-card-foot">
          <button type="submit" className="dsc-btn dsc-btn--primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AdminDiscountsPage() {
  const [data, setData] = useState<DiscountData | null>(null);
  const [allProducts, setAllProducts] = useState<BackendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [discountsResult, productsResult] = await Promise.allSettled([
        fetchAdminDiscounts(),
        fetchProducts({ limit: 100 }),
      ]);
      if (discountsResult.status === "rejected") throw discountsResult.reason;
      setData(discountsResult.value);
      if (productsResult.status === "fulfilled") {
        setAllProducts(productsResult.value?.products ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discount settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="admin-page-loading">
        <div className="admin-spinner" />
        <span>Loading…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-page-error">
        <p>{error || "No data returned."}</p>
        <p className="dsc-error-hint">Make sure the backend server is running and restart it if you recently added new files.</p>
        <button type="button" className="dsc-btn dsc-btn--ghost" onClick={load}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dsc-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Discounts &amp; Promotions</h1>
          <p className="admin-page-subtitle">Create and manage flash sales, bundles, best-price labels and the refund guarantee.</p>
        </div>
      </div>

      <div className="dsc-sections">
        <FlashSaleCard data={data} allProducts={allProducts} onSaved={load} />
        <BundleCard data={data} allProducts={allProducts} onSaved={load} />
        <BestPriceCard data={data} allProducts={allProducts} onSaved={load} />
        <RefundCard data={data} onSaved={load} />
      </div>
    </div>
  );
}
