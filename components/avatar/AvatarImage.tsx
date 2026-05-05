import { cn } from "@/lib/utils";
import type { AvatarState } from "@/lib/types/database";

const SKIN_THEME: Record<string, { body: string; cheek: string; size: number }> = {
  "level-1": { body: "#fde68a", cheek: "#fbbf24", size: 56 },
  "level-2": { body: "#fcd34d", cheek: "#f59e0b", size: 60 },
  "level-3": { body: "#fbbf24", cheek: "#d97706", size: 64 },
  "level-4": { body: "#a7f3d0", cheek: "#10b981", size: 68 },
  "level-5": { body: "#6ee7b7", cheek: "#059669", size: 72 },
  "level-6": { body: "#34d399", cheek: "#047857", size: 76 },
  "level-7": { body: "#60a5fa", cheek: "#2563eb", size: 80 },
  "level-8": { body: "#818cf8", cheek: "#4f46e5", size: 84 },
  "level-9": { body: "#a78bfa", cheek: "#7c3aed", size: 88 },
  "level-10": { body: "#f472b6", cheek: "#db2777", size: 92 },
};

export function AvatarImage({
  skin,
  state = "normal",
  className,
}: {
  skin: string;
  state?: AvatarState;
  className?: string;
}) {
  const theme = SKIN_THEME[skin] ?? SKIN_THEME["level-1"];
  const bodyR = theme.size / 2;
  const isLonely = state === "lonely";
  const isCelebrating = state === "celebrating";

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        isLonely && "grayscale opacity-60",
        className,
      )}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden>
        {isCelebrating && (
          <g>
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <circle
                key={deg}
                cx={100 + Math.cos((deg * Math.PI) / 180) * 80}
                cy={100 + Math.sin((deg * Math.PI) / 180) * 80}
                r="4"
                fill="#fbbf24"
              />
            ))}
          </g>
        )}
        <circle cx="100" cy="115" r={bodyR} fill={theme.body} />
        <circle cx="80" cy={115 - bodyR / 4} r="4" fill="#1f2937" />
        <circle cx="120" cy={115 - bodyR / 4} r="4" fill="#1f2937" />
        <circle cx="80" cy={115 + bodyR / 6} r="5" fill={theme.cheek} opacity="0.6" />
        <circle cx="120" cy={115 + bodyR / 6} r="5" fill={theme.cheek} opacity="0.6" />
        {!isLonely ? (
          <path
            d={`M ${100 - bodyR / 3} ${115 + bodyR / 4} Q 100 ${115 + bodyR / 2} ${100 + bodyR / 3} ${115 + bodyR / 4}`}
            stroke="#1f2937"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <path
            d={`M ${100 - bodyR / 3} ${115 + bodyR / 3} Q 100 ${115 + bodyR / 5} ${100 + bodyR / 3} ${115 + bodyR / 3}`}
            stroke="#1f2937"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
}
