"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const pendingCount = useRef(0);
  const showTimer = useRef(null);
  const hideTimer = useRef(null);
  const visibleSince = useRef(0);
  const visibleRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function clearTimers() {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
    }

    function start() {
      pendingCount.current += 1;
      if (pendingCount.current !== 1) {
        return;
      }
      window.clearTimeout(hideTimer.current);
      showTimer.current = window.setTimeout(() => {
        if (pendingCount.current > 0) {
          visibleSince.current = performance.now();
          visibleRef.current = true;
          setVisible(true);
        }
      }, 150);
    }

    function end() {
      pendingCount.current = Math.max(0, pendingCount.current - 1);
      if (pendingCount.current > 0) {
        return;
      }
      window.clearTimeout(showTimer.current);
      if (!visibleRef.current) {
        return;
      }
      const remaining = Math.max(0, 300 - (performance.now() - visibleSince.current));
      hideTimer.current = window.setTimeout(() => {
        visibleRef.current = false;
        setVisible(false);
      }, remaining);
    }

    window.addEventListener("elega:loading-start", start);
    window.addEventListener("elega:loading-end", end);
    return () => {
      clearTimers();
      window.removeEventListener("elega:loading-start", start);
      window.removeEventListener("elega:loading-end", end);
    };
  }, []);

  return (
    <LoadingContext.Provider value={null}>
      {children}
      {visible ? (
        <div className="loading-overlay" role="status" aria-live="polite" aria-label="Loading">
          <span className="loading-spinner" aria-hidden="true" />
        </div>
      ) : null}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
