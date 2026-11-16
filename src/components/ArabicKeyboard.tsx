import { Delete, Eraser, Space } from "lucide-react";
import type { LearningLevel } from "../types";

interface ArabicKeyboardProps {
  value: string;
  onChange: (nextValue: string) => void;
  level: LearningLevel;
}

const HARAKAT_KEYS = [
  { char: "\u064E", label: "ـَ", name: "Fathah" },
  { char: "\u0650", label: "ـِ", name: "Kasrah" },
  { char: "\u064F", label: "ـُ", name: "Dhammah" },
  { char: "\u0652", label: "ـْ", name: "Sukun" },
  { char: "\u0651", label: "ـّ", name: "Syaddah" },
  { char: "\u064B", label: "ـً", name: "Tanwin Fathah" },
  { char: "\u064D", label: "ـٍ", name: "Tanwin Kasrah" },
  { char: "\u064C", label: "ـٌ", name: "Tanwin Dhammah" },
];

const LETTER_ROWS = [
  ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
  ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"],
  ["ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ", "ذ"],
  ["أ", "إ", "آ", "ٱ", "،", ".", "؟"],
];

export function ArabicKeyboard({ value, onChange, level }: ArabicKeyboardProps) {
  const isMiddle = level === "middle";

  const appendChar = (char: string) => {
    onChange(value + char);
  };

  const handleBackspace = () => {
    if (!value) return;
    const chars = Array.from(value);
    chars.pop();
    onChange(chars.join(""));
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 select-none ${
        isMiddle
          ? "bg-teal-50/60 border-teal-200"
          : "bg-indigo-50/60 border-indigo-200"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-700">
          Keyboard Arab Virtual & Pilihan Harakat
        </span>
        <span className="text-xs text-slate-500">
          Klik huruf lalu klik harakat untuk memberi tanda baca
        </span>
      </div>

      {/* Harakat Row */}
      <div
        dir="rtl"
        className="flex flex-wrap items-center gap-1.5 mb-3 pb-3 border-b border-slate-200/80"
      >
        <span className="text-xs font-medium text-slate-600 ml-1" dir="ltr">
          Harakat:
        </span>
        {HARAKAT_KEYS.map((h) => (
          <button
            key={h.name}
            type="button"
            onClick={() => appendChar(h.char)}
            title={h.name}
            className={`min-w-[42px] h-10 px-2.5 rounded-xl font-arabic text-xl font-bold border transition-colors cursor-pointer ${
              isMiddle
                ? "bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100"
                : "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100"
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>

      {/* Arabic Letter Rows */}
      <div className="space-y-1.5" dir="rtl">
        {LETTER_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap justify-center gap-1.5">
            {row.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => appendChar(char)}
                className="min-w-[36px] sm:min-w-[42px] h-10 px-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-arabic text-lg font-semibold hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer shadow-2xs"
              >
                {char}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Control Row: Space, Backspace, Clear */}
      <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => appendChar(" ")}
          className="flex-1 min-w-[140px] max-w-[260px] h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer"
        >
          <Space className="w-4 h-4" />
          <span>Spasi (مَسَافَة)</span>
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="h-10 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-rose-100 cursor-pointer"
        >
          <Delete className="w-4 h-4" />
          <span>Hapus (حَذْف)</span>
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="h-10 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium inline-flex items-center justify-center gap-1.5 hover:bg-slate-200 cursor-pointer"
        >
          <Eraser className="w-4 h-4" />
          <span>Kosongkan</span>
        </button>
      </div>
    </div>
  );
}
