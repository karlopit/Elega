"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  bootstrapAdmin,
  createOrder,
  getCart,
  loginUser,
  registerUser,
  removeCartItem,
  upsertCartItem
} from "@/lib/api";

const StoreContext = createContext(null);
const AUTH_STORAGE_KEY = "elega.auth";
const GUEST_CART_KEY = "elega.guestCart";

function readStoredJson(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [guestCart, setGuestCart] = useState([]);
  const [remoteCart, setRemoteCart] = useState([]);
  const [status, setStatus] = useState({ type: "idle", message: "" });

  useEffect(() => {
    setAuth(readStoredJson(AUTH_STORAGE_KEY, null));
    setGuestCart(readStoredJson(GUEST_CART_KEY, []));
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
    }
  }, [guestCart]);

  async function refreshCart(nextAuth = auth) {
    if (!nextAuth?.user_id || !nextAuth?.access_token) {
      return;
    }

    const cart = await getCart(nextAuth.user_id, nextAuth.access_token);
    setRemoteCart(cart.items || []);
  }

  async function signIn(payload, mode) {
    setStatus({ type: "loading", message: "Preparing your Elega session." });
    try {
      const authPayload =
        mode === "setup"
          ? {
              email: payload.email,
              password: payload.password,
              full_name: payload.full_name,
              ...(payload.setup_secret?.trim() ? { setup_secret: payload.setup_secret.trim() } : {})
            }
          : payload;
      const response =
        mode === "setup"
          ? await bootstrapAdmin(authPayload)
          : mode === "register"
            ? await registerUser(authPayload)
            : await loginUser(authPayload);
      setAuth(response);
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response));

      for (const item of guestCart) {
        await upsertCartItem(response.user_id, response.access_token, {
          product_id: item.product_id,
          quantity: item.quantity
        });
      }

      setGuestCart([]);
      await refreshCart(response);
      setStatus({ type: "success", message: "You are signed in." });
      return response;
    } catch (err) {
      setStatus({ type: "idle", message: "" });
      throw err;
    }
  }

  function signOut() {
    setAuth(null);
    setRemoteCart([]);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setStatus({ type: "idle", message: "" });
  }

  async function addToCart(product, quantity = 1) {
    const nextQuantity = Math.max(1, Math.min(99, quantity));

    if (!auth) {
      setGuestCart((items) => {
        const existing = items.find((item) => item.product_id === product.id);
        if (existing) {
          return items.map((item) =>
            item.product_id === product.id
              ? { ...item, quantity: Math.min(99, item.quantity + nextQuantity) }
              : item
          );
        }
        return [
          ...items,
          {
            product_id: product.id,
            quantity: nextQuantity
          }
        ];
      });
      setStatus({ type: "success", message: "Item added to cart." });
      return;
    }

    const existing = remoteCart.find((item) => item.product_id === product.id);
    await upsertCartItem(auth.user_id, auth.access_token, {
      product_id: product.id,
      quantity: Math.min(99, (existing?.quantity || 0) + nextQuantity)
    });
    await refreshCart();
    setStatus({ type: "success", message: "Item added to cart." });
  }

  async function removeFromCart(productId) {
    if (!auth) {
      setGuestCart((items) => items.filter((item) => item.product_id !== productId));
      return;
    }

    await removeCartItem(auth.user_id, auth.access_token, productId);
    await refreshCart();
  }

  async function placeOrder(items, shippingAddress, paymentOption = "cash") {
    if (!auth) {
      throw new Error("Please sign in before checkout.");
    }

    const order = await createOrder(auth.access_token, {
      user_id: auth.user_id,
      shipping_address: shippingAddress,
      payment_option: paymentOption,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    });

    await Promise.all(items.map((item) => removeCartItem(auth.user_id, auth.access_token, item.product_id)));
    await refreshCart();
    return order;
  }

  const value = useMemo(
    () => ({
      auth,
      authReady,
      cartItems: auth ? remoteCart : guestCart,
      status,
      signIn,
      signOut,
      addToCart,
      removeFromCart,
      refreshCart,
      placeOrder
    }),
    [auth, authReady, guestCart, remoteCart, status]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStore must be used within StoreProvider.");
  }

  return context;
}
