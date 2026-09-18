"use client";

import { useEffect, useState } from "react";

/**
 * TEMPORARY DEV COMPONENT — Remove before production.
 *
 * Floating badge that pings the backend /health endpoint every 5 seconds
 * and displays the connection status with a color-coded indicator.
 */
export function BackendStatus() {
  const [status, setStatus] = useState("checking"); // "connected" | "disconnected" | "checking"
  const [latency, setLatency] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    async function checkHealth() {
      if (!apiUrl) {
        setStatus("disconnected");
        return;
      }

      const start = performance.now();
      try {
        const res = await fetch(`${apiUrl.replace(/\/$/, "")}/health`, {
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        const elapsed = Math.round(performance.now() - start);

        if (res.ok) {
          setStatus("connected");
          setLatency(elapsed);
        } else {
          setStatus("disconnected");
          setLatency(null);
        }
      } catch {
        setStatus("disconnected");
        setLatency(null);
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const colors = {
    connected: { dot: "#22c55e", bg: "rgba(22, 163, 74, 0.08)", border: "rgba(22, 163, 74, 0.25)", text: "#15803d" },
    disconnected: { dot: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.25)", text: "#dc2626" },
    checking: { dot: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.25)", text: "#d97706" },
  };

  const c = colors[status];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "Not configured";

  const label = {
    connected: "Backend Connected",
    disconnected: "Backend Disconnected",
    checking: "Checking…",
  };

  return (
    <div
      onClick={() => setExpanded((prev) => !prev)}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "12px",
        cursor: "pointer",
        userSelect: "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Collapsed pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: expanded ? "12px 16px" : "8px 14px",
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: expanded ? "12px" : "999px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          minWidth: expanded ? "240px" : "auto",
        }}
      >
        {/* Pulsing dot */}
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            width: "8px",
            height: "8px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              backgroundColor: c.dot,
              opacity: status === "connected" ? 0.4 : 0,
              animation: status === "connected" ? "backendPulse 2s ease-in-out infinite" : "none",
            }}
          />
          <span
            style={{
              position: "relative",
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: c.dot,
              animation: status === "checking" ? "backendBlink 1s ease-in-out infinite" : "none",
            }}
          />
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: expanded ? "6px" : "0" }}>
          <span
            style={{
              fontWeight: 600,
              color: c.text,
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {label[status]}
          </span>

          {expanded && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                fontSize: "11px",
                color: "#6b7280",
                fontWeight: 400,
              }}
            >
              <span>
                <strong style={{ color: "#374151" }}>URL:</strong> {apiUrl}
              </span>
              {latency !== null && (
                <span>
                  <strong style={{ color: "#374151" }}>Latency:</strong> {latency}ms
                </span>
              )}
              {status === "disconnected" && (
                <span style={{ color: "#dc2626", marginTop: "2px" }}>
                  Run the backend on port 8000
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Keyframe animations injected via style tag */}
      <style>{`
        @keyframes backendPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes backendBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
