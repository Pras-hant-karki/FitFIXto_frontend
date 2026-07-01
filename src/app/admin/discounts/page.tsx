"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Edit2, Package, Plus, Search, Tag, Trash2, X, Zap } from "lucide-react";
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
import { BackendProduct, fetchProducts } from "@/features/products";
import { API_BASE_URL } from "@/constants/api";

// ── helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function productImg(p: BackendProduct | DiscountProduct) {
  const img = (p as BackendProduct).images?.[0] ?? "";
  return img ? `${API_BASE_URL.replace("/api/v1", "")}/uploads/${img}` : "/placeholder.png";
}

// ── Product Picker modal ───────────────────────────────────────────────────

interface ProductPickerProps {
  title: string;
  selected: string[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}

function ProductPicker({ title, selected: initialSelected, onClose, onConfirm }: ProductPickerProps) {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<Set<string>>(new Set(initialSelected));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts({ limit: 200 })
      .then((r) => setProducts(r?.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const toggle = (id: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="discount-picker-overlay" onClick={onClose}>
      <div className="discount-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="discount-picker-header">
          <h3>{title}</h3>
          <button type="button" className="discount-picker-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="discount-picker-search">
          <Search size={15} />
          <input
            autoFocus
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="discount-picker-list">
          {loading && <p className="discount-picker-empty">Loading…</p>}
          {!loading && filtered.length === 0 && (
            <p className="discount-picker-empty">No products found.</p>
          )}
          {filtered.map((p) => (
            <label key={p._id} className={`discount-picker-item${chosen.has(p._id) ? " chosen" : ""}`}>
              <input
                type="checkbox"
                checked={chosen.has(p._id)}
                onChange={() => toggle(p._id)}
              />
              <img src={productImg(p)} alt={p.name} className="discount-picker-thumb" />
              <div className="discount-picker-info">
                <span className="discount-picker-name">{p.name}</span>
                <span className="discount-picker-price">{fmt(p.price)}</span>
              </div>
            </label>
          ))}
        </div>
        <div className="discount-picker-footer">
          <span className="discount-picker-count">{chosen.size} selected</span>
          <div className="discount-picker-actions">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => onConfirm(Array.from(chosen))}
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Flash Sale section ─────────────────────────────────────────────────────

function FlashSaleSection({
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
    (fs?.productIds ?? []).map((p) => (typeof p === "string" ? p : p._id))
  );
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const selectedProducts = allProducts.filter((p) => selectedIds.includes(p._id));

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await saveFlashSale({
        title: title.trim(),
        discountPercentage: Number(pct),
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        productIds: selectedIds,
        isActive,
      });
      setMsg("Flash sale saved.");
      onSaved();
    } catch {
      setMsg("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="discount-card">
      <div className="discount-card-header">
        <div className="discount-card-icon">
          <Zap size={18} />
        </div>
        <div>
          <h2 className="discount-card-title">Flash Sale</h2>
          <p className="discount-card-subtitle">Time-limited discount applied to selected products</p>
        </div>
        <label className="discount-toggle">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span className="discount-toggle-track">
            <span className="discount-toggle-thumb" />
          </span>
          <span className="discount-toggle-label">{isActive ? "Active" : "Inactive"}</span>
        </label>
      </div>

      <form onSubmit={handleSave} className="discount-card-body">
        <div className="discount-form-row">
          <div className="discount-form-field">
            <label>Sale Title</label>
            <input
              required
              placeholder="e.g. Summer Flash Sale"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="discount-form-field discount-form-field--sm">
            <label>Discount %</label>
            <input
              required
              type="number"
              min={1}
              max={99}
              placeholder="e.g. 20"
              value={pct}
              onChange={(e) => setPct(e.target.value)}
            />
          </div>
          <div className="discount-form-field">
            <label>Ends At (optional)</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        </div>

        <div className="discount-products-field">
          <div className="discount-products-header">
            <label>Products on sale ({selectedIds.length})</label>
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--sm"
              onClick={() => setShowPicker(true)}
            >
              <Plus size={14} />
              Choose Products
            </button>
          </div>
          {selectedProducts.length > 0 ? (
            <div className="discount-product-chips">
              {selectedProducts.map((p) => (
                <span key={p._id} className="discount-product-chip">
                  <img src={productImg(p)} alt="" />
                  {p.name}
                  <button
                    type="button"
                    onClick={() => setSelectedIds((ids) => ids.filter((id) => id !== p._id))}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="discount-products-empty">No products selected — sale will not apply.</p>
          )}
        </div>

        <div className="discount-card-footer">
          {msg && <span className="discount-msg">{msg}</span>}
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? "Saving…" : "Save Flash Sale"}
          </button>
        </div>
      </form>

      {showPicker && (
        <ProductPicker
          title="Select Flash Sale Products"
          selected={selectedIds}
          onClose={() => setShowPicker(false)}
          onConfirm={(ids) => {
            setSelectedIds(ids);
            setShowPicker(false);
          }}
        />
      )}
    </section>
  );
}

// ── Bundle Offers section ──────────────────────────────────────────────────

interface BundleFormState {
  title: string;
  description: string;
  discountPercentage: string;
  productIds: string[];
  isActive: boolean;
}

const emptyBundle: BundleFormState = {
  title: "",
  description: "",
  discountPercentage: "",
  productIds: [],
  isActive: true,
};

function BundleSection({
  data,
  allProducts,
  onSaved,
}: {
  data: DiscountData;
  allProducts: BackendProduct[];
  onSaved: () => void;
}) {
  const [bundles, setBundles] = useState<Bundle[]>(data.bundles ?? []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Bundle | null>(null);
  const [form, setForm] = useState<BundleFormState>(emptyBundle);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  useEffect(() => {
    setBundles(data.bundles ?? []);
  }, [data.bundles]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyBundle);
    setFormErr("");
    setIsFormOpen(true);
  };

  const openEdit = (b: Bundle) => {
    setEditing(b);
    setForm({
      title: b.title,
      description: b.description ?? "",
      discountPercentage: String(b.discountPercentage),
      productIds: b.productIds.map((p) => p._id),
      isActive: b.isActive,
    });
    setFormErr("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (form.productIds.length < 2) {
      setFormErr("Select at least 2 products for a bundle.");
      return;
    }
    setSaving(true);
    setFormErr("");
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        discountPercentage: Number(form.discountPercentage),
        productIds: form.productIds,
        isActive: form.isActive,
      };
      if (editing) {
        const updated = await updateBundle(editing._id, payload);
        if (updated) {
          setBundles((prev) => prev.map((b) => (b._id === editing._id ? updated : b)));
        }
      } else {
        const created = await createBundle(payload as Parameters<typeof createBundle>[0]);
        if (created) setBundles((prev) => [...prev, created]);
      }
      closeForm();
      onSaved();
    } catch {
      setFormErr("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bundle offer?")) return;
    try {
      await deleteBundle(id);
      setBundles((prev) => prev.filter((b) => b._id !== id));
      onSaved();
    } catch {}
  };

  const formSelectedProducts = allProducts.filter((p) => form.productIds.includes(p._id));

  return (
    <section className="discount-card">
      <div className="discount-card-header">
        <div className="discount-card-icon discount-card-icon--bundle">
          <Package size={18} />
        </div>
        <div>
          <h2 className="discount-card-title">Bundle Offers</h2>
          <p className="discount-card-subtitle">Group products together with a combined discount</p>
        </div>
        <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={openCreate}>
          <Plus size={14} />
          New Bundle
        </button>
      </div>

      <div className="discount-card-body">
        {bundles.length === 0 && (
          <p className="discount-empty">No bundle offers yet. Create one above.</p>
        )}
        <div className="discount-bundle-list">
          {bundles.map((b) => (
            <div key={b._id} className={`discount-bundle-item${b.isActive ? "" : " inactive"}`}>
              <div className="discount-bundle-info">
                <div className="discount-bundle-top">
                  <strong>{b.title}</strong>
                  <span className="discount-bundle-pct">{b.discountPercentage}% off</span>
                  {!b.isActive && <span className="discount-bundle-badge">Inactive</span>}
                </div>
                {b.description && <p className="discount-bundle-desc">{b.description}</p>}
                <div className="discount-bundle-products">
                  {b.productIds.slice(0, 4).map((p) => (
                    <img key={p._id} src={productImg(p)} alt={p.name} title={p.name} />
                  ))}
                  {b.productIds.length > 4 && (
                    <span className="discount-bundle-more">+{b.productIds.length - 4}</span>
                  )}
                  <span className="discount-bundle-count">{b.productIds.length} products</span>
                </div>
              </div>
              <div className="discount-bundle-actions">
                <button
                  type="button"
                  className="admin-icon-btn"
                  title="Edit"
                  onClick={() => openEdit(b)}
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn--danger"
                  title="Delete"
                  onClick={() => handleDelete(b._id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isFormOpen && (
        <div className="discount-picker-overlay" onClick={closeForm}>
          <div className="discount-picker-modal discount-bundle-form" onClick={(e) => e.stopPropagation()}>
            <div className="discount-picker-header">
              <h3>{editing ? "Edit Bundle" : "New Bundle Offer"}</h3>
              <button type="button" className="discount-picker-close" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="discount-bundle-form-body">
              <div className="discount-form-field">
                <label>Bundle Title *</label>
                <input
                  required
                  placeholder="e.g. Starter Kit"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="discount-form-field">
                <label>Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="discount-form-row">
                <div className="discount-form-field discount-form-field--sm">
                  <label>Discount % *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={99}
                    placeholder="e.g. 15"
                    value={form.discountPercentage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, discountPercentage: e.target.value }))
                    }
                  />
                </div>
                <div className="discount-form-field discount-toggle-field">
                  <label>Status</label>
                  <label className="discount-toggle">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    <span className="discount-toggle-track">
                      <span className="discount-toggle-thumb" />
                    </span>
                    <span className="discount-toggle-label">
                      {form.isActive ? "Active" : "Inactive"}
                    </span>
                  </label>
                </div>
              </div>
              <div className="discount-products-field">
                <div className="discount-products-header">
                  <label>Products ({form.productIds.length} / min 2) *</label>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--sm"
                    onClick={() => setShowPicker(true)}
                  >
                    <Plus size={13} />
                    Choose
                  </button>
                </div>
                {formSelectedProducts.length > 0 ? (
                  <div className="discount-product-chips">
                    {formSelectedProducts.map((p) => (
                      <span key={p._id} className="discount-product-chip">
                        <img src={productImg(p)} alt="" />
                        {p.name}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              productIds: f.productIds.filter((id) => id !== p._id),
                            }))
                          }
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="discount-products-empty">No products selected yet.</p>
                )}
              </div>
              {formErr && <p className="discount-form-err">{formErr}</p>}
              <div className="discount-picker-footer">
                <span />
                <div className="discount-picker-actions">
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={closeForm}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                    {saving ? "Saving…" : editing ? "Update Bundle" : "Create Bundle"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPicker && (
        <ProductPicker
          title="Select Bundle Products"
          selected={form.productIds}
          onClose={() => setShowPicker(false)}
          onConfirm={(ids) => {
            setForm((f) => ({ ...f, productIds: ids }));
            setShowPicker(false);
          }}
        />
      )}
    </section>
  );
}

// ── Best Price Labels section ──────────────────────────────────────────────

function BestPriceSection({
  data,
  allProducts,
  onSaved,
}: {
  data: DiscountData;
  allProducts: BackendProduct[];
  onSaved: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    (data.bestPriceProductIds ?? []).map((p) => (typeof p === "string" ? p : p._id))
  );
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const selectedProducts = allProducts.filter((p) => selectedIds.includes(p._id));

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await saveBestPrice(selectedIds);
      setMsg("Best price labels saved.");
      onSaved();
    } catch {
      setMsg("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="discount-card">
      <div className="discount-card-header">
        <div className="discount-card-icon discount-card-icon--best">
          <Tag size={18} />
        </div>
        <div>
          <h2 className="discount-card-title">Best-Price Labels</h2>
          <p className="discount-card-subtitle">
            Flag products that show a &ldquo;Best Price&rdquo; badge on the storefront
          </p>
        </div>
      </div>

      <div className="discount-card-body">
        <div className="discount-products-field">
          <div className="discount-products-header">
            <label>Labelled products ({selectedIds.length})</label>
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--sm"
              onClick={() => setShowPicker(true)}
            >
              <Plus size={14} />
              Choose Products
            </button>
          </div>
          {selectedProducts.length > 0 ? (
            <div className="discount-product-chips">
              {selectedProducts.map((p) => (
                <span key={p._id} className="discount-product-chip">
                  <img src={productImg(p)} alt="" />
                  {p.name}
                  <button
                    type="button"
                    onClick={() => setSelectedIds((ids) => ids.filter((id) => id !== p._id))}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="discount-products-empty">No products labelled yet.</p>
          )}
        </div>
        <div className="discount-card-footer">
          {msg && <span className="discount-msg">{msg}</span>}
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Labels"}
          </button>
        </div>
      </div>

      {showPicker && (
        <ProductPicker
          title="Select Best-Price Products"
          selected={selectedIds}
          onClose={() => setShowPicker(false)}
          onConfirm={(ids) => {
            setSelectedIds(ids);
            setShowPicker(false);
          }}
        />
      )}
    </section>
  );
}

// ── Refund Guarantee section ───────────────────────────────────────────────

function RefundSection({ data, onSaved }: { data: DiscountData; onSaved: () => void }) {
  const [text, setText] = useState(data.refundGuarantee ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await saveRefundGuarantee(text.trim());
      setMsg("Refund guarantee saved.");
      onSaved();
    } catch {
      setMsg("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="discount-card">
      <div className="discount-card-header">
        <div className="discount-card-icon discount-card-icon--refund">
          <span className="discount-refund-icon">↩</span>
        </div>
        <div>
          <h2 className="discount-card-title">Refund Guarantee</h2>
          <p className="discount-card-subtitle">
            Short message displayed on the storefront about your return/refund policy
          </p>
        </div>
      </div>
      <form onSubmit={handleSave} className="discount-card-body">
        <div className="discount-form-field">
          <label>Guarantee Text</label>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="e.g. 30-day hassle-free returns on all products."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <span className="discount-char-count">{text.length}/500</span>
        </div>
        <div className="discount-card-footer">
          {msg && <span className="discount-msg">{msg}</span>}
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? "Saving…" : "Save Guarantee"}
          </button>
        </div>
      </form>
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminDiscountsPage() {
  const [data, setData] = useState<DiscountData | null>(null);
  const [allProducts, setAllProducts] = useState<BackendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [discounts, products] = await Promise.all([
        fetchAdminDiscounts(),
        fetchProducts({ limit: 200 }),
      ]);
      setData(discounts);
      setAllProducts(products?.products ?? []);
    } catch {
      setError("Failed to load discount settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="admin-page-loading">
        <div className="admin-spinner" />
        <span>Loading discounts…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-page-error">
        <p>{error || "No data returned."}</p>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-discounts-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Discounts &amp; Promotions</h1>
          <p className="admin-page-subtitle">
            Manage flash sales, bundle offers, best-price labels and refund policy
          </p>
        </div>
      </div>

      <div className="discount-sections">
        <FlashSaleSection data={data} allProducts={allProducts} onSaved={load} />
        <BundleSection data={data} allProducts={allProducts} onSaved={load} />
        <BestPriceSection data={data} allProducts={allProducts} onSaved={load} />
        <RefundSection data={data} onSaved={load} />
      </div>
    </div>
  );
}
