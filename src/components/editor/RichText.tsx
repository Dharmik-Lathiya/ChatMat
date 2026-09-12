"use client";

/**
 * Renders rich text already saved in TipTap HTML format.
 * Content produced by the editor is sanitized by TipTap on parse.
 */
export function RichText({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={`tiptap ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}