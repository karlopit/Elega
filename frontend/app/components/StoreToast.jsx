"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";

export function StoreToast() {
  const { status } = useStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!["success", "error"].includes(status.type) || !status.message) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(timer);
  }, [status]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 border bg-paper px-5 py-3 text-sm font-medium shadow-soft ${
        status.type === "error" ? "border-red-300 text-red-700" : "border-gold text-ink"
      }`}
    >
      {status.message}
    </div>
  );
}
