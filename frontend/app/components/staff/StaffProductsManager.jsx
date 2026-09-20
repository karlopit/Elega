"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Edit3, Plus, Upload, X } from "lucide-react";
import { StaffSidebar } from "@/components/staff/StaffSidebar";
import { ActionButton } from "@/components/ActionButton";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { useStore } from "@/context/StoreContext";
import { createProduct, getApiErrorMessage, listProducts, updateProduct, uploadProductImage } from "@/lib/api";
import { formatMoney } from "@/lib/format";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  currency: "PHP",
  image_url: "",
  stock_quantity: 1,
  is_active: true
};

export function StaffProductsManager({ section }) {
  const router = useRouter();
  const { auth, authReady } = useStore();
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disablingId, setDisablingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    if (!auth) {
      router.push("/account");
      return;
    }
    if (auth.role !== "staff" && auth.role !== "admin") {
      router.push("/shop");
      return;
    }
    refreshProducts();
  }, [auth, authReady, router, section]);

  async function refreshProducts() {
    setLoading(true);
    try {
      const data = await listProducts(true);
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  const sectionProducts = useMemo(
    () => products.filter((product) => product.category?.toUpperCase() === section),
    [products, section]
  );

  function openCreateModal() {
    setSelectedProduct(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
    setMessage("");
    setError("");
  }

  function openEditModal(product) {
    setSelectedProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      currency: product.currency || "PHP",
      image_url: product.image_url || "",
      stock_quantity: product.stock_quantity,
      is_active: product.is_active
    });
    setModalOpen(true);
    setMessage("");
    setError("");
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const result = await uploadProductImage(file, auth.access_token);
      setForm((current) => ({ ...current, image_url: result.image_url }));
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Image upload failed."));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const payload = {
      ...form,
      category: section,
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity)
    };

    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, auth.access_token, payload);
        setMessage("Product updated.");
      } else {
        await createProduct(auth.access_token, payload);
        setMessage("Product added.");
      }
      setModalOpen(false);
      await refreshProducts();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Unable to save product."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable(product) {
    setError("");
    setMessage("");
    setDisablingId(product.id);
    try {
      await updateProduct(product.id, auth.access_token, { is_active: false });
      setMessage("Product disabled.");
      await refreshProducts();
    } catch (err) {
      console.error(err);
      setError("Unable to disable product.");
    } finally {
      setDisablingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-paper md:flex">
      <StaffSidebar />
      <section className="flex-1 px-5 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">Staff Workspace</p>
              <h1 className="mt-3 font-display text-5xl font-semibold text-ink">{section} products</h1>
            </div>
            <button
              className="focus-ring inline-flex items-center justify-center gap-2 border border-gold bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-paper transition hover:bg-paper hover:text-gold"
              onClick={openCreateModal}
              type="button"
            >
              <Plus size={16} />
              Add product
            </button>
          </div>

          {message ? <p className="mt-6 border border-gold bg-ivory px-4 py-3 text-sm text-ink">{message}</p> : null}
          {error ? <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          {loading ? (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => <SkeletonBlock className="aspect-[4/5] w-full" key={item} />)}
            </div>
          ) : (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {sectionProducts.map((product) => (
              <article className="border-b border-line pb-6" key={product.id}>
                <div className="relative aspect-[4/5] bg-ivory">
                  <Image
                    alt={product.name}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1024px) 30vw, 100vw"
                    src={product.image_url || "/product-placeholder.svg"}
                  />
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-ink">{product.name}</h2>
                    <p className="mt-2 text-sm text-muted">
                      {formatMoney(product.price, product.currency)} | Stock {product.stock_quantity}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gold">
                      {product.is_active ? "Active" : "Disabled"}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    className="focus-ring inline-flex items-center justify-center gap-2 border border-line px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition hover:border-gold hover:text-gold"
                    onClick={() => openEditModal(product)}
                    type="button"
                  >
                    <Edit3 size={15} />
                    Edit
                  </button>
                  <ActionButton
                    className="focus-ring border border-line px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:border-gold hover:text-gold"
                    onClick={() => handleDisable(product)}
                    pending={disablingId === product.id}
                    type="button"
                  >
                    {disablingId === product.id ? "Disabling" : "Disable"}
                  </ActionButton>
                </div>
              </article>
            ))}
          </div>
          )}
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 px-5 backdrop-blur-sm">
          <form className="w-full max-w-lg border border-line bg-paper p-6 shadow-soft" onSubmit={handleSubmit}>
            <div className="flex items-start justify-between border-b border-line pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">{section}</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
                  {selectedProduct ? "Edit product" : "Add product"}
                </h2>
              </div>
              <button className="focus-ring rounded-full border border-line p-2 text-muted" onClick={() => setModalOpen(false)} type="button">
                <X size={17} />
              </button>
            </div>

            <label className="mt-6 block text-sm font-medium text-ink">
              Product picture
              <ActionButton
                as="label"
                className="mt-2 w-full cursor-pointer border border-line bg-ivory px-4 py-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                pending={uploading}
              >
                  <Upload size={15} />
                  {uploading ? "Uploading" : "Upload image"}
                  <input className="hidden" accept="image/*" disabled={uploading} onChange={handleImageUpload} type="file" />
              </ActionButton>
            </label>
            <input
              className="focus-ring mt-3 w-full border border-line bg-ivory px-4 py-3 text-sm text-ink"
              onChange={(event) => setForm({ ...form, image_url: event.target.value })}
              placeholder="Or paste image URL"
              value={form.image_url}
            />

            <label className="mt-5 block text-sm font-medium text-ink">
              Product name
              <input className="focus-ring mt-2 w-full border border-line bg-ivory px-4 py-3 text-sm text-ink" onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} />
            </label>
            <label className="mt-5 block text-sm font-medium text-ink">
              Price
              <input className="focus-ring mt-2 w-full border border-line bg-ivory px-4 py-3 text-sm text-ink" min="0.01" onChange={(event) => setForm({ ...form, price: event.target.value })} required step="0.01" type="number" value={form.price} />
            </label>
            <label className="mt-5 block text-sm font-medium text-ink">
              Quantity
              <input className="focus-ring mt-2 w-full border border-line bg-ivory px-4 py-3 text-sm text-ink" min="0" onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })} required type="number" value={form.stock_quantity} />
            </label>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button className="focus-ring border border-line px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted transition hover:border-gold hover:text-gold" onClick={() => setModalOpen(false)} type="button">
                Cancel
              </button>
              <ActionButton
                className="focus-ring border border-gold bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-paper transition hover:bg-paper hover:text-gold"
                pending={saving}
                type="submit"
              >
                {selectedProduct ? "Save" : "Add"}
              </ActionButton>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
