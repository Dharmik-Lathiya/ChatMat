"use client";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export default function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute -top-10 left-0 z-20 flex gap-0.5 rounded-full border border-ink-200 bg-white px-1.5 py-1 shadow-pop"
      onClick={(e) => e.stopPropagation()}
    >
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
          className="rounded-full px-1.5 py-0.5 text-sm transition-transform hover:scale-125"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
