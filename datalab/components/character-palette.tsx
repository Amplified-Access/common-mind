"use client";

/**
 * Buttons for the letters a standard keyboard lacks in a language (from
 * languages.extra_characters). Each inserts its letter at the cursor of the
 * given editor and keeps focus there.
 */
function CharacterPalette({
  characters,
  editor,
  value,
  onChange,
}: {
  characters: string[];
  editor: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
}) {
  if (characters.length === 0) return null;

  const insert = (ch: string) => {
    const el = editor.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + ch + value.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Insert a character">
      {characters.map((ch) => (
        <button
          key={ch}
          type="button"
          onClick={() => insert(ch)}
          className="size-9 cursor-pointer rounded-inset border border-line text-lg transition-colors hover:border-foreground hover:text-foreground"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}

export { CharacterPalette };
