"use client";

export function ActionButton({ as = "button", children, className = "", pending = false, disabled = false, ...props }) {
  const Component = as;
  const isButton = as === "button";

  return (
    <Component
      {...props}
      aria-busy={pending || undefined}
      className={`${className} inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50`}
      disabled={isButton ? pending || disabled : undefined}
    >
      {pending ? <span aria-hidden="true" className="action-spinner" /> : null}
      <span>{children}</span>
    </Component>
  );
}
