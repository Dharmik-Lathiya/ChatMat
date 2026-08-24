"use client";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

const palette = [
  "bg-brand-100 text-brand-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
];

export function Avatar({
  name,
  photoURL,
  size = "md",
}: {
  name: string;
  photoURL?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-16 w-16 text-lg",
  };

  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote avatars vary in origin; plain img keeps this dependency-free
      <img
        src={photoURL}
        alt={name}
        referrerPolicy="no-referrer"
        className={`shrink-0 rounded-full object-cover ${sizes[size]}`}
      />
    );
  }

  const color =
    palette[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];

  return (
    <span
      aria-hidden
      className={`flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${sizes[size]} ${color}`}
    >
      {initials(name || "?")}
    </span>
  );
}
