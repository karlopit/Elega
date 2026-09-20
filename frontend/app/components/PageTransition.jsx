"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }) {
  const pathname = usePathname();
  const [transitionKey, setTransitionKey] = useState(0);

  useEffect(() => {
    setTransitionKey((current) => current + 1);
    window.dispatchEvent(new CustomEvent("elega:loading-start"));
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("elega:loading-end"));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <div className="page-transition" key={`${pathname}-${transitionKey}`}>
        {children}
      </div>
    </>
  );
}
