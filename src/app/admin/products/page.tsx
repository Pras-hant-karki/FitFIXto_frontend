"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Edit2, Plus, Search, Star, Trash2, X } from "lucide-react";
import { useToast } from "@/contexts";
import {
  BackendProduct,
  ProductPayload,
  createProduct,
  deleteProduct,
  fetchProducts,
  formatCategory,
  getProductImage,
  getCategoryOption,
  getDefaultSubcategory,
  productCategoryTree,
  updateProduct,
  uploadProductImages,
} from "@/features/products";

type ProductFormState = {
  name: string;
  description: string;
  importedFrom: string;
  warrantyMonths: string;
  weight: string;
  weightUnit: "gm" | "kg";
  dimensionLength: string;
  dimensionWidth: string;
  dimensionHeight: string;
  price: string;
  stock: string;
  category: ProductPayload["category"];
  subcategory: string;
  brand: string;
  imageUrl: string;
  sku: string;
  tags: string;
  isFeatured: boolean;
  isActive: boolean;
  verifiedBadge: boolean;
};

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  importedFrom: "",
  warrantyMonths: "",
  weight: "",
  weightUnit: "kg",
  dimensionLength: "",
  dimensionWidth: "",
  dimensionHeight: "",
  price: "",
  stock: "",
  category: "strength_equipment",
  subcategory: "Dumbbells",
  brand: "",
  imageUrl: "",
  sku: "",
  tags: "",
  isFeatured: false,
  isActive: true,
  verifiedBadge: false,
};

const toFormState = (product: BackendProduct): ProductFormState => ({
  name: product.name,
  description: product.description,
  importedFrom: product.importedFrom || product.specifications || "",
  warrantyMonths: product.warrantyMonths !== undefined ? String(product.warrantyMonths) : "",
  weight: product.weight !== undefined ? String(product.weight) : "",
  weightUnit: product.weightUnit || "kg",
  dimensionLength: product.dimensions?.length !== undefined ? String(product.dimensions.length) : "",
  dimensionWidth: product.dimensions?.width !== undefined ? String(product.dimensions.width) : "",
  dimensionHeight: product.dimensions?.height !== undefined ? String(product.dimensions.height) : "",
  price: String(product.price),
  stock: String(product.stock),
  category: product.category === "gym_equipment" ? "strength_equipment" : product.category,
  subcategory: product.subcategory || getDefaultSubcategory(product.category),
  brand: product.brand || "",
  imageUrl: product.images[0] || "",
  sku: product.sku || "",
  tags: product.tags?.join(", ") || "",
  isFeatured: product.isFeatured,
  isActive: product.isActive ?? true,
  verifiedBadge: product.verifiedBadge,
});

const toPayload = (form: ProductFormState): ProductPayload => ({
  name: form.name.trim(),
  description: form.description.trim(),
  importedFrom: form.importedFrom.trim() || undefined,
  warrantyMonths: form.warrantyMonths.trim() ? Number(form.warrantyMonths) : undefined,
  weight: form.weight.trim() ? Number(form.weight) : undefined,
  weightUnit: form.weightUnit,
  dimensions:
    form.dimensionLength.trim() || form.dimensionWidth.trim() || form.dimensionHeight.trim()
      ? {
          length: form.dimensionLength.trim() ? Number(form.dimensionLength) : undefined,
          width: form.dimensionWidth.trim() ? Number(form.dimensionWidth) : undefined,
          height: form.dimensionHeight.trim() ? Number(form.dimensionHeight) : undefined,
        }
      : undefined,
  price: Number(form.price),
  stock: Number(form.stock),
  category: form.category,
  subcategory: form.subcategory.trim() || undefined,
  brand: form.brand.trim() || undefined,
  images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
  sku: form.sku.trim() || undefined,
  tags: form.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean),
  isFeatured: form.isFeatured,
  isActive: form.isActive,
  verifiedBadge: form.verifiedBadge,
});

const PAGE_LIMIT = 20;

const DEFAULT_PRODUCTS_PAGINATION = {
  total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1, hasNextPage: false, hasPrevPage: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [productsPagination, setProductsPagination] = useState(DEFAULT_PRODUCTS_PAGINATION);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [customCategories, setCustomCategories] = useState<Array<{ label: string; value: string }>>([]);
  const [customSubcategories, setCustomSubcategories] = useState<Record<string, string[]>>({});
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BackendProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const featuredCount = useMemo(() => products.filter((product) => product.isFeatured).length, [products]);
  const categoryOptions = useMemo(() => {
    const options = new Map<string, { label: string; value: string }>();

    productCategoryTree.forEach((category) => options.set(category.value, { label: category.label, value: category.value }));
    products.forEach((product) => {
      if (!product.category) return;
      options.set(product.category, { label: formatCategory(product.category), value: product.category });
    });
    customCategories.forEach((category) => options.set(category.value, category));

    return Array.from(options.values());
  }, [customCategories, products]);

  const subcategoryOptions = useMemo(() => {
    const options = new Set<string>();
    getCategoryOption(form.category)?.subcategories.forEach((subcategory) => options.add(subcategory));
    products
      .filter((product) => product.category === form.category && product.subcategory)
      .forEach((product) => options.add(product.subcategory as string));
    (customSubcategories[form.category] || []).forEach((subcategory) => options.add(subcategory));

    return Array.from(options);
  }, [customSubcategories, form.category, products]);

  const selectedFileLabel = selectedImageFiles.length
    ? selectedImageFiles.map((file) => file.name).join(", ")
    : "No file chosen";

  const loadProducts = async (query = searchQuery, page = 1) => {
    setIsLoading(true);

    try {
      const response = await fetchProducts({
        page,
        limit: PAGE_LIMIT,
        sortBy: "createdAt",
        order: "desc",
        ...(query.trim() ? { search: query.trim() } : {}),
      });
      setProducts(response?.products || []);
      setProductsPagination(response?.pagination || DEFAULT_PRODUCTS_PAGINATION);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts("", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateForm = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setSelectedImageFiles([]);
    setIsFormOpen(true);
  };

  const openEditForm = (product: BackendProduct) => {
    setEditingProduct(product);
    setForm(toFormState(product));
    setSelectedImageFiles([]);
    setIsFormOpen(true);
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
    setCurrentPage(1);
    await loadProducts(searchQuery, 1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadProducts(searchQuery, newPage);
  };

  const handleCategoryChange = (category: string) => {
    setForm((current) => ({ ...current, category, subcategory: getDefaultSubcategory(category) }));
  };

  const handleAddCategory = () => {
    const label = window.prompt("Enter new category name");
    const trimmedLabel = label?.trim();

    if (!trimmedLabel) return;

    const value = trimmedLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

    if (!value) return;

    setCustomCategories((current) =>
      current.some((category) => category.value === value) ? current : [...current, { label: trimmedLabel, value }]
    );
    setForm((current) => ({ ...current, category: value, subcategory: "" }));
  };

  const handleAddSubcategory = () => {
    const label = window.prompt("Enter new subcategory name");
    const trimmedLabel = label?.trim();

    if (!trimmedLabel) return;

    setCustomSubcategories((current) => {
      const existing = current[form.category] || [];
      return existing.includes(trimmedLabel) ? current : { ...current, [form.category]: [...existing, trimmedLabel] };
    });
    setForm((current) => ({ ...current, subcategory: trimmedLabel }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const payload = toPayload(form);

      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
        toast.success("Product updated.");
      } else {
        await createProduct(payload);
        toast.success("Product created.");
      }

      closeForm();
      await loadProducts(searchQuery, currentPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelection = (files: FileList | null) => {
    setSelectedImageFiles(files ? Array.from(files) : []);
  };

  const handleImageUpload = async () => {
    if (!selectedImageFiles.length) {
      toast.error("Please choose an image before uploading.");
      return;
    }

    setIsUploading(true);

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
      toast.success(`${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded successfully.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to upload product images.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFeaturedToggle = async (product: BackendProduct) => {
    try {
      const updatedProduct = await updateProduct(product._id, { isFeatured: !product.isFeatured });
      if (updatedProduct) {
        setProducts((current) => current.map((item) => (item._id === updatedProduct._id ? updatedProduct : item)));
      }
      toast.success(updatedProduct?.isFeatured ? "Product starred as featured." : "Product removed from featured.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update featured product.");
    }
  };

  const handleDelete = async (product: BackendProduct) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;

    try {
      await deleteProduct(product._id);
      setProducts((current) => current.filter((item) => item._id !== product._id));
      toast.success("Product deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete product.");
    }
  };

  return (
    <section className="admin-products-page">
      <header className="admin-products-header">
        <div>
          <h1>Products</h1>
          <p>
            {productsPagination.total} products · {featuredCount}/9 featured on homepage
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
              <span className="admin-product-select-row">
                <button type="button" onClick={handleAddCategory} aria-label="Add product category">
                  <Plus aria-hidden="true" />
                </button>
                <select value={form.category} onChange={(event) => handleCategoryChange(event.target.value)}>
                  {categoryOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </span>
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
              Subcategory
              <span className="admin-product-select-row">
                <button type="button" onClick={handleAddSubcategory} aria-label="Add product subcategory">
                  <Plus aria-hidden="true" />
                </button>
                <select value={form.subcategory} onChange={(event) => setForm((current) => ({ ...current, subcategory: event.target.value }))}>
                  <option value="">Select subcategory</option>
                  {subcategoryOptions.map((subcategory) => (
                    <option value={subcategory} key={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </span>
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
              <div className="admin-product-extra-fields">
                <label className="admin-product-imported-field">
                  Imported from
                  <textarea
                    placeholder="Seller company name, address and import details"
                    value={form.importedFrom}
                    onChange={(event) => setForm((current) => ({ ...current, importedFrom: event.target.value }))}
                  />
                </label>
                <label>
                  Warranty
                  <input
                    min="0"
                    step="1"
                    type="number"
                    placeholder="Months"
                    value={form.warrantyMonths}
                    onChange={(event) => setForm((current) => ({ ...current, warrantyMonths: event.target.value }))}
                  />
                </label>
                <label>
                  Product weight
                  <span className="admin-product-weight-field">
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      placeholder="Weight"
                      value={form.weight}
                      onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))}
                    />
                    <select
                      value={form.weightUnit}
                      onChange={(event) => setForm((current) => ({ ...current, weightUnit: event.target.value as "gm" | "kg" }))}
                      aria-label="Weight unit"
                    >
                      <option value="gm">gm</option>
                      <option value="kg">kg</option>
                    </select>
                  </span>
                </label>
                <label className="admin-product-dimensions-field">
                  Dimension
                  <span>
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      placeholder={"l''"}
                      title="Enter length in inches"
                      value={form.dimensionLength}
                      onChange={(event) => setForm((current) => ({ ...current, dimensionLength: event.target.value }))}
                    />
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      placeholder={"b''"}
                      title="Enter breadth in inches"
                      value={form.dimensionWidth}
                      onChange={(event) => setForm((current) => ({ ...current, dimensionWidth: event.target.value }))}
                    />
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      placeholder={"h''"}
                      title="Enter height in inches"
                      value={form.dimensionHeight}
                      onChange={(event) => setForm((current) => ({ ...current, dimensionHeight: event.target.value }))}
                    />
                  </span>
                </label>
                <label>
                  SKU
                  <input
                    value={form.sku}
                    onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                  />
                </label>
              </div>

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
            <label className="admin-feature-check">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Product is active (visible to customers)
            </label>
            <label className="admin-feature-check">
              <input
                type="checkbox"
                checked={form.verifiedBadge}
                onChange={(event) => setForm((current) => ({ ...current, verifiedBadge: event.target.checked }))}
              />
              Show verified badge on product card
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
                    <span>{product.verifiedBadge ? "Verified" : product.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>
                <span>{[formatCategory(product.category), product.subcategory].filter(Boolean).join(" / ")}</span>
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

      {productsPagination.totalPages > 1 ? (
        <div className="admin-pagination">
          <button
            type="button"
            disabled={!productsPagination.hasPrevPage}
            onClick={() => handlePageChange(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <span>
            Page {productsPagination.page} of {productsPagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!productsPagination.hasNextPage}
            onClick={() => handlePageChange(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
