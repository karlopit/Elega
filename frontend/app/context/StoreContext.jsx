"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  bootstrapAdmin,
  createOrder,
  getApiErrorMessage,
  getCart,
  loginUser,
  refreshSession,
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
  const cartSnapshotRef = useRef([]);
  const cartSyncRef = useRef(new Map());

  useEffect(() => {
    const storedGuestCart = readStoredJson(GUEST_CART_KEY, []);
    cartSnapshotRef.current = storedGuestCart;
    setGuestCart(storedGuestCart);
    const storedAuth = readStoredJson(AUTH_STORAGE_KEY, null);

    async function restoreSession() {
      if (!storedAuth?.refresh_token) {
        setAuth(storedAuth);
        setAuthReady(true);
        return;
      }

      try {
        const refreshedAuth = await refreshSession(storedAuth.refresh_token);
        const nextAuth = {
          ...refreshedAuth,
          refresh_token: refreshedAuth.refresh_token || storedAuth.refresh_token
        };
        setAuth(nextAuth);
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
      } catch (error) {
        console.error(error);
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        setAuth(null);
      } finally {
        setAuthReady(true);
      }
    }

    restoreSession();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
    }
  }, [guestCart]);

  const refreshCart = useCallback(async (nextAuth = auth) => {
    if (!nextAuth?.user_id || !nextAuth?.access_token) {
      return;
    }

    const cart = await getCart(nextAuth.user_id, nextAuth.access_token);
    const items = cart.items || [];
    cartSnapshotRef.current = items;
    setRemoteCart(items);
  }, [auth]);

  useEffect(() => {
    if (!authReady || !auth) {
      return;
    }

    refreshCart(auth).catch((error) => {
      console.error(error);
      setStatus({ type: "error", message: "We could not load your cart right now." });
    });
  }, [auth, authReady, refreshCart]);

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

      const accountCart = await getCart(response.user_id, response.access_token);
      const accountQuantities = new Map(
        (accountCart.items || []).map((item) => [item.product_id, item.quantity])
      );
      for (const item of guestCart) {
        await upsertCartItem(response.user_id, response.access_token, {
          product_id: item.product_id,
          quantity: Math.min(99, (accountQuantities.get(item.product_id) || 0) + item.quantity)
        });
      }

      setGuestCart([]);
      cartSnapshotRef.current = [];
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
    cartSnapshotRef.current = guestCart;
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setStatus({ type: "idle", message: "" });
  }

  async function addToCart(product, quantity = 1) {
    const nextQuantity = Math.max(1, Math.min(99, quantity));

    if (!auth) {
      const existing = cartSnapshotRef.current.find((item) => item.product_id === product.id);
      const nextItems = existing
        ? cartSnapshotRef.current.map((item) =>
            item.product_id === product.id
              ? { ...item, quantity: Math.min(99, item.quantity + nextQuantity) }
              : item
          )
        : [...cartSnapshotRef.current, { product_id: product.id, quantity: nextQuantity }];
      cartSnapshotRef.current = nextItems;
      setGuestCart(nextItems);
      setStatus({ type: "success", message: "Item added to cart." });
      return;
    }

    const currentItems = cartSnapshotRef.current;
    const existing = currentItems.find((item) => item.product_id === product.id);
    const targetQuantity = Math.min(99, (existing?.quantity || 0) + nextQuantity);
    const nextItems = existing
      ? currentItems.map((item) =>
          item.product_id === product.id ? { ...item, quantity: targetQuantity } : item
        )
      : [...currentItems, { product_id: product.id, quantity: targetQuantity }];

    // Update the visible cart before the network round trip so the badge is
    // responsive. The per-product queue makes rapid clicks cumulative instead
    // of letting concurrent requests overwrite one another with stale values.
    cartSnapshotRef.current = nextItems;
    setRemoteCart(nextItems);

    const previous = cartSyncRef.current.get(product.id) || Promise.resolve();
    const operation = previous
      .catch(() => undefined)
      .then(() =>
        upsertCartItem(auth.user_id, auth.access_token, {
          product_id: product.id,
          quantity: targetQuantity
        })
      );
    cartSyncRef.current.set(product.id, operation);

    try {
      await operation;
      if (cartSyncRef.current.get(product.id) === operation) {
        await refreshCart(auth);
        cartSyncRef.current.delete(product.id);
      }
      setStatus({ type: "success", message: "Item added to cart." });
    } catch (error) {
      if (cartSyncRef.current.get(product.id) === operation) {
        cartSyncRef.current.delete(product.id);
        try {
          await refreshCart(auth);
        } catch (refreshError) {
          console.error(refreshError);
        }
      }
      setStatus({ type: "error", message: getApiErrorMessage(error, "Unable to add this item to your cart.") });
      throw error;
    }
  }

  async function removeFromCart(productId) {
    if (!auth) {
      const nextItems = cartSnapshotRef.current.filter((item) => item.product_id !== productId);
      cartSnapshotRef.current = nextItems;
      setGuestCart(nextItems);
      return;
    }

    await removeCartItem(auth.user_id, auth.access_token, productId);
    await refreshCart();
  }

  async function renewAuthSession(currentAuth = auth) {
    if (!currentAuth?.refresh_token) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    const refreshedAuth = await refreshSession(currentAuth.refresh_token);
    const nextAuth = {
      ...refreshedAuth,
      refresh_token: refreshedAuth.refresh_token || currentAuth.refresh_token
    };
    setAuth(nextAuth);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
    return nextAuth;
  }

  async function placeOrder(items, shippingAddress, paymentOption = "cash", coordinates = null) {
    if (!auth) {
      throw new Error("Please sign in before checkout.");
    }

    if (!items?.length) {
      throw new Error("Your cart is empty.");
    }

    if (shippingAddress.trim().length < 10) {
      throw new Error("Please enter a complete shipping address.");
    }

    const orderPayload = {
      user_id: auth.user_id,
      shipping_address: shippingAddress,
      payment_option: paymentOption,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };

    let session = auth;
    let order;
    try {
      order = await createOrder(session.access_token, orderPayload);
    } catch (error) {
      if (error.status !== 401 || !session.refresh_token) {
        throw error;
      }
      session = await renewAuthSession(session);
      order = await createOrder(session.access_token, orderPayload);
    }

    try {
      await refreshCart(session);
    } catch (refreshError) {
      console.error(refreshError);
      cartSnapshotRef.current = [];
      setRemoteCart([]);
    }
    setStatus({ type: "success", message: "Order placed successfully." });
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
