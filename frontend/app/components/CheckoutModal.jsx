"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { X } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { getApiErrorMessage, getPaymentQr, reverseGeocode } from "@/lib/api";
import { ActionButton } from "@/components/ActionButton";

const AddressMap = dynamic(() => import("@/components/AddressMap").then((module) => module.AddressMap), {
  ssr: false,
  loading: () => <div className="mt-5 h-64 animate-pulse rounded-sm border border-line bg-ivory" />
});

export function CheckoutModal({ items, open, onClose }) {
  const { auth, placeOrder, signIn } = useStore();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [address, setAddress] = useState("");
  const [paymentOption, setPaymentOption] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ address: false, payment: false });
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [qrError, setQrError] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [mapMessage, setMapMessage] = useState("");
  const reverseTimer = useRef(null);

  useEffect(() => {
    if (!open) {
      setAddress("");
      setPaymentOption("");
      setMessage("");
      setFieldErrors({ address: false, payment: false });
      setConfirmed(false);
      setQrUrl(null);
      setQrError("");
      setLoginForm({ email: "", password: "" });
      setLoginError("");
      setCoordinates(null);
      setMapMessage("");
      return;
    }

    if (paymentOption !== "gcash") {
      setQrUrl(null);
      setQrError("");
      setQrLoading(false);
      return;
    }

    let active = true;
    setQrLoading(true);
    setQrError("");
    getPaymentQr()
      .then((data) => {
        if (active) {
          setQrUrl(data.image_url || null);
          setQrError("");
        }
      })
      .catch((error) => {
        console.error(error);
        if (active) {
          setQrUrl(null);
          setQrError(getApiErrorMessage(error, "The GCash QR code is temporarily unavailable."));
        }
      })
      .finally(() => {
        if (active) {
          setQrLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, paymentOption]);

  useEffect(() => () => window.clearTimeout(reverseTimer.current), []);

  async function handleSignIn(event) {
    event.preventDefault();
    setLoginError("");
    if (!loginForm.email.includes("@") || loginForm.password.length < 8) {
      setLoginError("Use a valid email and a password with at least 8 characters.");
      return;
    }

    setLoginPending(true);
    try {
      await signIn(loginForm, "login");
    } catch (error) {
      console.error(error);
      setLoginError(getApiErrorMessage(error, "We could not sign you in. Please try again."));
    } finally {
      setLoginPending(false);
    }
  }

  async function handleConfirm(event) {
    event.preventDefault();
    setMessage("");

    if (!auth) {
      setMessage("Please log in before buying.");
      return;
    }

    const missingAddress = !address.trim();
    const shortAddress = address.trim().length > 0 && address.trim().length < 10;
    const missingPayment = !paymentOption;
    if (missingAddress || missingPayment || shortAddress) {
      setFieldErrors({ address: missingAddress || shortAddress, payment: missingPayment });
      setMessage(
        missingAddress && missingPayment
          ? "Please enter your address and choose a payment option to continue."
          : missingAddress || shortAddress
            ? "Please enter a complete address to continue."
            : "Please choose a payment option to continue."
      );
      return;
    }

    setSaving(true);
    try {
      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));
      await placeOrder(orderItems, address, paymentOption, coordinates);
      setConfirmed(true);
    } catch (error) {
      console.error(error);
      setMessage(getApiErrorMessage(error, "We could not place the order. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  function handleAddressChange(event) {
    setAddress(event.target.value);
    if (event.target.value.trim()) {
      setFieldErrors((current) => ({ ...current, address: false }));
      setMessage("");
    }
  }

  function handlePaymentChange(event) {
    setPaymentOption(event.target.value);
    if (event.target.value) {
      setFieldErrors((current) => ({ ...current, payment: false }));
      setMessage("");
    }
  }

  const handlePinSettled = useCallback((nextCoordinates) => {
    setCoordinates(nextCoordinates);
    setMapMessage("Looking up the address from your pin…");
    window.clearTimeout(reverseTimer.current);
    reverseTimer.current = window.setTimeout(async () => {
      try {
        const result = await reverseGeocode(nextCoordinates.latitude, nextCoordinates.longitude);
        if (result.display_name) {
          setAddress(result.display_name);
          setFieldErrors((current) => ({ ...current, address: false }));
          setMessage("");
        }
        setMapMessage(result.display_name ? "Address filled from the pin. You can edit it." : "Type the address manually if the lookup is incomplete.");
      } catch (error) {
        console.error(error);
        setMapMessage("We could not look up the address. Please type it manually; the pin will still be saved.");
      }
    }, 450);
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 px-5 backdrop-blur-sm">
      <form
        className="max-h-[90vh] w-full max-w-md overflow-y-auto border border-line bg-paper p-6 shadow-soft"
        onSubmit={auth ? handleConfirm : handleSignIn}
      >
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

         {!auth ? (
           <>
             <p className="mt-6 text-sm leading-6 text-muted">Sign in to continue to checkout. Your cart will stay intact and merge with your account.</p>
             <label className="mt-6 block text-sm font-medium text-ink">
               Email
               <input
                 autoComplete="username"
                 className="focus-ring mt-2 w-full border border-line bg-ivory px-4 py-3 text-sm text-ink"
                 onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                 type="email"
                 value={loginForm.email}
               />
             </label>
             <label className="mt-5 block text-sm font-medium text-ink">
               Password
               <input
                 autoComplete="current-password"
                 className="focus-ring mt-2 w-full border border-line bg-ivory px-4 py-3 text-sm text-ink"
                 onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                 type="password"
                 value={loginForm.password}
               />
             </label>
             {loginError ? <p className="mt-4 text-sm text-red-700">{loginError}</p> : null}
             <div className="mt-7 grid grid-cols-2 gap-3">
               <button
                 className="focus-ring border border-line px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted transition hover:border-gold hover:text-gold"
                 onClick={onClose}
                 type="button"
               >
                 Cancel
               </button>
               <ActionButton
                 className="focus-ring border border-gold bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-paper transition hover:bg-paper hover:text-gold"
                 pending={loginPending}
                 type="submit"
               >
                 {loginPending ? "Signing in" : "Sign in"}
               </ActionButton>
             </div>
           </>
         ) : confirmed ? (
           <div className="mt-8 border border-gold bg-ivory px-5 py-6">
             <p className="font-display text-3xl font-semibold text-ink">Order placed successfully</p>
             <p className="mt-3 text-sm leading-6 text-muted">Thank you. Your order has been placed and your cart is up to date.</p>
             <Link className="focus-ring mt-6 inline-flex border border-gold bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-paper transition hover:bg-paper hover:text-gold" href="/shop" onClick={onClose}>
               Back to shop
             </Link>
           </div>
         ) : (
           <>
             <label className="mt-6 block text-sm font-medium text-ink">
               Address
               <textarea
                 className={`focus-ring mt-2 min-h-28 w-full resize-none border bg-ivory px-4 py-3 text-sm text-ink ${fieldErrors.address ? "border-red-300" : "border-line"}`}
                 onChange={handleAddressChange}
                 value={address}
               />
             </label>

             <AddressMap
               coordinates={coordinates}
               onLocationError={setMapMessage}
               onPinSettled={handlePinSettled}
             />
             {mapMessage ? <p className="mt-2 text-xs leading-5 text-muted">{mapMessage}</p> : null}

             <label className="mt-5 block text-sm font-medium text-ink">
               Payment option
               <select
                 className={`focus-ring mt-2 w-full border bg-ivory px-4 py-3 text-sm uppercase tracking-[0.12em] text-ink ${fieldErrors.payment ? "border-red-300" : "border-line"}`}
                 onChange={handlePaymentChange}
                 value={paymentOption}
               >
                 <option value="">Choose payment method</option>
                 <option value="cash">Cash</option>
                 <option value="gcash">GCash</option>
               </select>
             </label>

             {paymentOption === "gcash" ? (
               <div className="mt-5 border border-line bg-ivory p-4">
                 <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">GCash QR</p>
                  {qrLoading ? (
                    <p className="mt-3 text-sm text-muted">Loading payment QR code.</p>
                  ) : qrError ? (
                    <p className="mt-3 text-sm leading-6 text-muted">{qrError}</p>
                  ) : qrUrl ? (
                   <img alt="GCash payment QR code" className="mx-auto mt-4 h-48 w-48 bg-paper object-contain p-2" src={qrUrl} />
                 ) : (
                   <p className="mt-3 text-sm leading-6 text-muted">The store has not uploaded a GCash QR code yet. Please choose another payment method or contact support.</p>
                 )}
               </div>
             ) : null}

             {message ? <p className="mt-4 text-sm text-red-700">{message}</p> : null}

             <div className="mt-7 grid grid-cols-2 gap-3">
               <button
                 className="focus-ring border border-line px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted transition hover:border-gold hover:text-gold"
                 onClick={onClose}
                 type="button"
               >
                 Cancel
               </button>
               <ActionButton
                 className="focus-ring border border-gold bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-paper transition hover:bg-paper hover:text-gold"
                 pending={saving}
                 type="submit"
               >
                 {saving ? "Confirming" : "Confirm"}
               </ActionButton>
             </div>
           </>
         )}
      </form>
    </div>
  );
}
