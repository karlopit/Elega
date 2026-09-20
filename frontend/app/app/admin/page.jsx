"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useStore } from "@/context/StoreContext";
import { getAdminDashboard, getApiErrorMessage, getPaymentQr, uploadPaymentQr, deletePaymentQr } from "@/lib/api";
import { ActionButton } from "@/components/ActionButton";
import { SkeletonBlock } from "@/components/SkeletonBlock";

const MAX_QR_SIZE = 5 * 1024 * 1024;
const QR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AdminDashboard() {
  const router = useRouter();
  const { auth, authReady } = useStore();
  const [stats, setStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState(null);
  const [qrMessage, setQrMessage] = useState("");
  const [qrError, setQrError] = useState("");
  const [qrBusy, setQrBusy] = useState(false);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    if (!auth) {
      router.push("/account");
      return;
    }
    if (auth.role !== "admin") {
      router.push("/shop");
      return;
    }

    getAdminDashboard(auth.access_token)
      .then(setStats)
      .catch((err) => {
        console.error(err);
        setError("Unable to load dashboard.");
      })
      .finally(() => setDashboardLoading(false));
    getPaymentQr()
      .then((data) => setQrUrl(data.image_url || null))
      .catch((err) => {
        console.error(err);
        setQrError(getApiErrorMessage(err, "Unable to load the payment QR code."));
      });
  }, [auth, authReady, router]);

  async function handleQrUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setQrMessage("");
    setQrError("");
    if (!QR_TYPES.includes(file.type)) {
      setQrError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_QR_SIZE) {
      setQrError("The payment QR code must be 5MB or smaller.");
      return;
    }

    setQrBusy(true);
    try {
      const result = await uploadPaymentQr(file, auth.access_token);
      setQrUrl(result.image_url);
      setQrMessage("GCash QR code uploaded.");
    } catch (err) {
      console.error(err);
      setQrError(getApiErrorMessage(err, "Unable to upload the payment QR code."));
    } finally {
      setQrBusy(false);
    }
  }

  async function handleQrDelete() {
    setQrMessage("");
    setQrError("");
    setQrBusy(true);
    try {
      await deletePaymentQr(auth.access_token);
      setQrUrl(null);
      setQrMessage("GCash QR code deleted.");
    } catch (err) {
      console.error(err);
      setQrError(getApiErrorMessage(err, "Unable to delete the payment QR code."));
    } finally {
      setQrBusy(false);
    }
  }

  const maxQuantity = Math.max(...(stats?.top_sold_products || []).map((item) => item.quantity), 1);

  return (
    <main className="min-h-screen bg-paper md:flex">
      <AdminSidebar />
      <section className="flex-1 px-5 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">Admin</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-ink">Dashboard</h1>

          {error ? <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <section className="mt-10 border border-line bg-ivory p-6" id="payment-qr">
            <div className="flex flex-col justify-between gap-5 border-b border-line pb-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Checkout setting</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-ink">GCash payment QR</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                  Upload the QR image customers should scan when they choose GCash at checkout. Re-uploading replaces the current image.
                </p>
              </div>
              <ActionButton
                as="label"
                className="focus-ring cursor-pointer border border-gold bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-paper transition hover:bg-paper hover:text-gold"
                pending={qrBusy}
              >
                {qrBusy ? "Saving" : "Upload QR"}
                <input
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={qrBusy}
                  onChange={handleQrUpload}
                  type="file"
                />
              </ActionButton>
            </div>
            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
              {qrUrl ? (
                <img alt="Current GCash payment QR code" className="h-48 w-48 border border-line bg-paper object-contain p-2" src={qrUrl} />
              ) : (
                <div className="grid h-48 w-48 place-items-center border border-dashed border-line bg-paper p-5 text-center text-sm text-muted">
                  No QR code uploaded
                </div>
              )}
              <div className="text-sm text-muted">
                <p>Supported files: JPEG, PNG, WebP, or GIF up to 5MB.</p>
                {qrUrl ? (
                  <ActionButton
                    className="focus-ring mt-5 border border-line px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition hover:border-red-300 hover:text-red-700"
                    onClick={handleQrDelete}
                    pending={qrBusy}
                    type="button"
                  >
                    Delete QR code
                  </ActionButton>
                ) : null}
              </div>
            </div>
            {qrMessage ? <p className="mt-5 border border-gold bg-paper px-4 py-3 text-sm text-ink">{qrMessage}</p> : null}
            {qrError ? <p className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{qrError}</p> : null}
          </section>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {dashboardLoading ? (
              [0, 1, 2].map((item) => <SkeletonBlock className="h-36 w-full" key={item} />)
            ) : (
              <>
                <div className="border border-line bg-ivory p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Sold quantity</p>
                  <p className="mt-4 font-display text-5xl font-semibold text-ink">{stats?.sold_quantity ?? 0}</p>
                </div>
                <div className="border border-line bg-ivory p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Available products</p>
                  <p className="mt-4 font-display text-5xl font-semibold text-ink">{stats?.available_products ?? 0}</p>
                </div>
                <div className="border border-line bg-ivory p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Top products tracked</p>
                  <p className="mt-4 font-display text-5xl font-semibold text-ink">{stats?.top_sold_products?.length ?? 0}</p>
                </div>
              </>
            )}
          </div>

          <section className="mt-10 border border-line bg-ivory p-6">
            <div className="flex items-end justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Graph</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Top 10 sold products</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {(stats?.top_sold_products || []).length > 0 ? (
                stats.top_sold_products.map((product) => (
                  <div className="grid gap-2 md:grid-cols-[220px_1fr_64px] md:items-center" key={product.product_id}>
                    <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
                    <div className="h-3 bg-paper">
                      <div
                        className="h-full bg-gold"
                        style={{ width: `${Math.max(8, (product.quantity / maxQuantity) * 100)}%` }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-muted md:text-right">{product.quantity}</p>
                  </div>
                ))
              ) : (
                <p className="py-8 text-sm text-muted">No sold products yet.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
