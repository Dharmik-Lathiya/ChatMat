export function ChatmatLogo({
  size = "lg",
}: {
  size?: "sm" | "lg";
}) {
  const text = size === "lg" ? "text-4xl" : "text-sm";

  return (
    <span className={`${text} font-extrabold tracking-tight text-ink-900 dark:text-white`}>
      Chat<span className="text-brand-500">mat</span>
    </span>
  );
}