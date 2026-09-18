"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";

export function StoreToast() {
  const { status } = useStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status.type !== "success" || !status.message) {
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
    <div className="fixed bottom-5 right-5 z-50 border border-gold bg-paper px-5 py-3 text-sm font-medium text-ink shadow-soft">
      {status.message}
    </div>
  );
}
