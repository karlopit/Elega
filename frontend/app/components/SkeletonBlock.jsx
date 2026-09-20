"use client";

export function SkeletonBlock({ className = "" }) {
  return <div aria-hidden="true" className={`skeleton-block ${className}`} />;
}
