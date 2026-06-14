"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Edit2, Plus, Search, Star, Trash2, X } from "lucide-react";
import {
  BackendProduct,
  ProductPayload,
  createProduct,
  deleteProduct,
  fetchProducts,
  formatCategory,
  getProductImage,
  updateProduct,
  uploadProductImages,
} from "@/features/products";

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: ProductPayload["category"];
  brand: string;
  imageUrl: string;
  sku: string;
  tags: string;
  isFeatured: boolean;
};

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "gym_equipment",
  brand: "",
  imageUrl: "",
  sku: "",
  tags: "",
  isFeatured: false,
};

const categoryOptions: Array<{ label: string; value: ProductPayload["category"] }> = [
  { label: "Gym Equipment", value: "gym_equipment" },
  { label: "Supplements", value: "supplements" },
  { label: "Accessories", value: "accessories" },
];

const toFormState = (product: BackendProduct): ProductFormState => ({
  name: product.name,
  description: product.description,
  price: String(product.price),
  stock: String(product.stock),
  category: product.category as ProductPayload["category"],
  brand: product.brand || "",
  imageUrl: product.images[0] || "",
  sku: product.sku || "",
  tags: product.tags?.join(", ") || "",
  isFeatured: product.isFeatured,
});

const toPayload = (form: ProductFormState): ProductPayload => ({
  name: form.name.trim(),
  description: form.description.trim(),
  price: Number(form.price),
  stock: Number(form.stock),
  category: form.category,
  brand: form.brand.trim() || undefined,
  images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
  sku: form.sku.trim() || undefined,
  tags: form.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean),
  isFeatured: form.isFeatured,
  isActive: true,
});

export default function AdminProductsPage() {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BackendProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const featuredCount = useMemo(() => products.filter((product) => product.isFeatured).length, [products]);
  const selectedFileLabel = selectedImageFiles.length
    ? selectedImageFiles.map((file) => file.name).join(", ")
    : "No file chosen";

  const loadProducts = async (query = searchQuery) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchProducts({
        limit: 100,
        sortBy: "createdAt",
        order: "desc",
        ...(query.trim() ? { search: query.trim() } : {}),
      });
      setProducts(response?.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateForm = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setSelectedImageFiles([]);
    setIsFormOpen(true);
    setMessage("");
    setError("");
  };

  const openEditForm = (product: BackendProduct) => {
    setEditingProduct(product);
    setForm(toFormState(product));
    setSelectedImageFiles([]);
    setIsFormOpen(true);
    setMessage("");
    setError("");
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setSelectedImageFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadProducts(searchQuery);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = toPayload(form);

      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
        setMessage("Product updated successfully.");
      } else {
        await createProduct(payload);
        setMessage("Product created successfully.");
      }

      closeForm();
      await loadProducts(searchQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelection = (files: FileList | null) => {
    setSelectedImageFiles(files ? Array.from(files) : []);
  };

  const handleImageUpload = async () => {
    if (!selectedImageFiles.length) {
      setError("Please choose an image before uploading.");
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const uploadedUrls = await uploadProductImages(selectedImageFiles);
      const [primaryImage] = uploadedUrls;

      if (primaryImage) {
        setForm((current) => ({ ...current, imageUrl: primaryImage }));
      }

      setSelectedImageFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setMessage(`${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload product images.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasteUrl = async () => {
    setError("");

    try {
      const clipboardValue = await navigator.clipboard.readText();
      if (!clipboardValue.trim()) {
        setError("Clipboard is empty.");
        return;
      }

      setForm((current) => ({ ...current, imageUrl: clipboardValue.trim() }));
    } catch {
      setError("Clipboard permission was blocked. Paste the URL manually.");
    }
  };

  const handleFeaturedToggle = async (product: BackendProduct) => {
    setError("");
    setMessage("");

    try {
      const updatedProduct = await updateProduct(product._id, { isFeatured: !product.isFeatured });
      if (updatedProduct) {
        setProducts((current) => current.map((item) => (item._id === updatedProduct._id ? updatedProduct : item)));
      }
      setMessage(updatedProduct?.isFeatured ? "Product starred as featured." : "Product removed from featured.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update featured product.");
    }
  };

  const handleDelete = async (product: BackendProduct) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;

    setError("");
    setMessage("");

    try {
      await deleteProduct(product._id);
      setProducts((current) => current.filter((item) => item._id !== product._id));
      setMessage("Product deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete product.");
    }
  };

  return (
    <section className="admin-products-page">
      <header className="admin-products-header">
        <div>
          <h1>Products</h1>
          <p>
            {products.length} products · {featuredCount}/9 featured on homepage
          </p>
        </div>
        <button type="button" className="admin-create-button" onClick={openCreateForm}>
          <Plus aria-hidden="true" />
          Create Product
        </button>
      </header>

      <form className="admin-product-search" onSubmit={handleSearch}>
        <Search aria-hidden="true" />
        <input
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </form>

      {message ? <p className="admin-products-message success">{message}</p> : null}
      {error ? <p className="admin-products-message error">{error}</p> : null}

      {isFormOpen ? (
        <div className="admin-product-form-card">
          <div className="admin-card-header">
            <h2>{editingProduct ? "Edit Product" : "Create Product"}</h2>
            <button type="button" className="admin-form-close" onClick={closeForm} aria-label="Close product form">
              <X aria-hidden="true" />
            </button>
          </div>
          <form className="admin-product-form" onSubmit={handleSubmit}>
            <label>
              Product name
              <input
                required
                minLength={2}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              Brand
              <input
                value={form.brand}
                onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
              />
            </label>
            <label>
              Category
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value as ProductPayload["category"] }))
                }
              >
                {categoryOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Price
              <input
                required
                min="1"
                step="0.01"
                type="number"
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              />
            </label>
            <label>
              Inventory
              <input
                required
                min="0"
                step="1"
                type="number"
                value={form.stock}
                onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
              />
            </label>
            <label>
              SKU
              <input
                value={form.sku}
                onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
              />
            </label>
            <div className="admin-product-media-row">
              <div className="admin-upload-field">
                <span>Upload product image</span>
                <button
                  type="button"
                  className="admin-upload-drop"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Choose product image files"
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
                  {isUploading ? "Uploading..." : "Upload Picture"}
                </button>
              </div>

              <label className="admin-url-field">
                Image URL
                <div>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                  />
                  <button type="button" onClick={handlePasteUrl}>
                    Paste URL
                  </button>
                </div>
              </label>
            </div>
            {form.imageUrl ? (
              <div className="admin-product-image-preview">
                <img src={form.imageUrl} alt="" />
                <span>Current product image</span>
              </div>
            ) : null}
            <label className="admin-product-form-wide">
              Tags
              <input
                placeholder="dumbbells, strength, home gym"
                value={form.tags}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              />
            </label>
            <label className="admin-product-form-wide">
              Description
              <textarea
                required
                minLength={10}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <label className="admin-feature-check">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))}
              />
              Star as featured/favourite product
            </label>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
            </button>
          </form>
        </div>
      ) : null}

      <div className="admin-products-table-card">
        <div className="admin-products-table">
          <div className="admin-products-table-head">
            <span>Star</span>
            <span>Product</span>
            <span>Category</span>
            <span>Brand</span>
            <span>Price</span>
            <span>Inventory</span>
            <span>Actions</span>
          </div>

          {isLoading ? (
            <div className="admin-products-empty">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="admin-products-empty">No products found.</div>
          ) : (
            products.map((product) => (
              <div className="admin-products-row" key={product._id}>
                <button
                  type="button"
                  className={`admin-star-button ${product.isFeatured ? "active" : ""}`}
                  onClick={() => handleFeaturedToggle(product)}
                  aria-label={product.isFeatured ? "Remove from featured products" : "Mark as featured product"}
                >
                  <Star aria-hidden="true" />
                </button>
                <div className="admin-product-cell">
                  {getProductImage(product) ? (
                    <img src={getProductImage(product)} alt="" />
                  ) : (
                    <span className="admin-product-no-image">No image</span>
                  )}
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.verifiedBadge ? "Verified" : product.isActive ? "New" : "Inactive"}</span>
                  </div>
                </div>
                <span>{formatCategory(product.category)}</span>
                <span>{product.brand || "FitFIXto"}</span>
                <strong>Npr {product.price}</strong>
                <span className={product.stock <= 10 ? "admin-low-stock" : undefined}>
                  {product.stock} pc in stock
                </span>
                <div className="admin-product-actions">
                  <button type="button" onClick={() => openEditForm(product)}>
                    <Edit2 aria-hidden="true" />
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(product)}>
                    <Trash2 aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
