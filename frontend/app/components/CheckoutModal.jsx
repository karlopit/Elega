"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export function CheckoutModal({ items, open, onClose }) {
  const { auth, placeOrder } = useStore();
  const [address, setAddress] = useState("");
  const [paymentOption, setPaymentOption] = useState("cash");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) {
    return null;
  }

  async function handleConfirm(event) {
    event.preventDefault();
    setMessage("");

    if (!auth) {
      setMessage("Please log in before buying.");
      return;
    }

    if (address.trim().length < 10) {
      setMessage("Enter a complete address.");
      return;
    }

    setSaving(true);
    try {
      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));
      await placeOrder(orderItems, address, paymentOption);
      setAddress("");
      setPaymentOption("cash");
      setMessage("Order confirmed.");
      onClose();
    } catch (error) {
      console.error(error);
      setMessage("We could not place the order. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 px-5 backdrop-blur-sm">
      <form className="w-full max-w-md border border-line bg-paper p-6 shadow-soft" onSubmit={handleConfirm}>
        <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Checkout</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Confirm purchase</h2>
          </div>
          <button
            aria-label="Close checkout"
            className="focus-ring rounded-full border border-line p-2 text-muted transition hover:border-gold hover:text-gold"
            onClick={onClose}
            type="button"
          >
            <X size={17} />
          </button>
        </div>

        <label className="mt-6 block text-sm font-medium text-ink">
          Address
          <textarea
            className="focus-ring mt-2 min-h-28 w-full resize-none border border-line bg-ivory px-4 py-3 text-sm text-ink"
            onChange={(event) => setAddress(event.target.value)}
            value={address}
          />
        </label>

        <label className="mt-5 block text-sm font-medium text-ink">
          Payment option
          <select
            className="focus-ring mt-2 w-full border border-line bg-ivory px-4 py-3 text-sm uppercase tracking-[0.12em] text-ink"
            onChange={(event) => setPaymentOption(event.target.value)}
            value={paymentOption}
          >
            <option value="cash">Cash</option>
            <option value="gcash">GCash</option>
          </select>
        </label>

        {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            className="focus-ring border border-line px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted transition hover:border-gold hover:text-gold"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="focus-ring border border-gold bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-paper transition hover:bg-paper hover:text-gold disabled:opacity-50"
            disabled={saving}
            type="submit"
          >
            {saving ? "Confirming" : "Confirm"}
          </button>
        </div>
      </form>
    </div>
  );
}
