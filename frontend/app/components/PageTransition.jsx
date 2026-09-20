"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }) {
  const pathname = usePathname();
  const [transitionKey, setTransitionKey] = useState(0);

  useEffect(() => {
    setTransitionKey((current) => current + 1);
  }, [pathname]);

  return (
    <>
      {transitionKey > 0 ? <div aria-hidden="true" className="route-progress" key={transitionKey} /> : null}
      <div className="page-transition" key={`${pathname}-${transitionKey}`}>
        {children}
      </div>
    </>
  );
}
