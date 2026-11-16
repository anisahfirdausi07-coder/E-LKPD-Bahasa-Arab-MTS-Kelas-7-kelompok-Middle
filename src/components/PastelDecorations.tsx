import type { LearningLevel } from "../types";

interface PastelDecorationsProps {
  level: LearningLevel;
}

export function PastelDecorations({ level }: PastelDecorationsProps) {
  const isMiddle = level === "middle";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
    >
      {/* Top-right soft cloud & star */}
      <svg
        className="absolute -top-8 right-6 w-64 h-40 opacity-60 animate-gentle-float"
        viewBox="0 0 260 160"
        fill="none"
      >
        <path
          d="M52 128h154c22 0 38-15 38-34 0-17-13-31-30-33-6-23-27-39-52-39-22 0-42 13-50 33-5-2-10-3-16-3-23 0-42 18-44 41-15 3-26 15-26 29 0 16 12 26 26 26z"
          fill={isMiddle ? "#CCFBF1" : "#E0E7FF"}
        />
        <path
          d="M214 34l3.5 8.5 9 .7-6.8 6 2 8.8-7.7-4.7-7.7 4.7 2-8.8-6.8-6 9-.7z"
          fill={isMiddle ? "#FDBA74" : "#FDE68A"}
        />
      </svg>

      {/* Top-left pastel cloud & star */}
      <svg
        className="hidden md:block absolute top-24 -left-10 w-56 h-36 opacity-50"
        viewBox="0 0 240 150"
        fill="none"
      >
        <path
          d="M42 118h146c20 0 34-13 34-30 0-15-11-28-27-30-5-20-24-35-47-35-20 0-37 11-44 29-4-2-9-3-14-3-20 0-38 16-40 37-13 3-23 13-23 26 0 14 11 26 15 26z"
          fill={isMiddle ? "#DBEAFE" : "#FCE7F3"}
        />
        <circle cx="194" cy="40" r="5" fill={isMiddle ? "#5EEAD4" : "#C4B5FD"} />
      </svg>

      {/* Bottom-right subtle open book & pencil accent */}
      <svg
        className="hidden lg:block absolute bottom-6 right-8 w-36 h-28 opacity-40"
        viewBox="0 0 160 120"
        fill="none"
      >
        <path
          d="M24 38c20-6 38-2 52 8v52c-14-9-32-13-52-7V38zm112 0c-20-6-38-2-52 8v52c14-9 32-13 52-7V38z"
          fill={isMiddle ? "#FED7AA" : "#FDE68A"}
          stroke={isMiddle ? "#0D9488" : "#6366F1"}
          strokeWidth="2"
        />
        <path
          d="M126 18l14 14-44 44-18 4 4-18 44-44z"
          fill={isMiddle ? "#99F6E4" : "#C7D2FE"}
          stroke={isMiddle ? "#0F766E" : "#4F46E5"}
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
