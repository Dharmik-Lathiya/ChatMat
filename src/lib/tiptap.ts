/**
 * Convert TipTap JSON content (or fallback HTML / plain text) into a
 * plain-text string, used for list previews and search.
 */
export function richTextToPlain(content: string): string {
  if (!content) return "";
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const json = JSON.parse(trimmed);
      const parts: string[] = [];
      const walk = (node: unknown) => {
        if (!node) return;
        if (Array.isArray(node)) {
          node.forEach(walk);
          return;
        }
        if (typeof node === "object") {
          const obj = node as Record<string, unknown>;
          if (typeof obj.text === "string") parts.push(obj.text);
          if (obj.content) walk(obj.content);
        }
      };
      walk(json);
      return parts.join(" ").replace(/\s+/g, " ").trim();
    } catch {
      // Fall through to raw text below.
    }
  }
  return trimmed.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}