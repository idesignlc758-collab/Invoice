"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function Keypad({ onKey }: { onKey: (key: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
      {KEYS.map((key, i) =>
        key === "" ? (
          <div key={`spacer-${i}`} />
        ) : (
          <button
            key={key}
            type="button"
            onClick={() => onKey(key)}
            aria-label={key === "⌫" ? "Backspace" : key}
            className="h-16 rounded-2xl bg-card border border-line text-2xl font-display font-bold
                       active:scale-95 active:bg-line transition-transform
                       flex items-center justify-center select-none"
          >
            {key}
          </button>
        )
      )}
    </div>
  );
}
