"use client";

export function ActionButton({ as = "button", children, className = "", pending = false, disabled = false, ...props }) {
  const Component = as;
  const isButton = as === "button";

  return (
    <Component
      {...props}
      className={`${className} inline-flex items-center justify-center gap-2 leading-none disabled:cursor-not-allowed`}
      disabled={isButton ? pending || disabled : undefined}
    >
      {children}
    </Component>
  );
}
