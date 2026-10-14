import type { AnswerResult } from "@/lib/scoring";

// 1978 arcade bitmaps, one character per pixel ("X" = lit).
const INVADER_FRAMES = [
  [
    "..X.....X..",
    "...X...X...",
    "..XXXXXXX..",
    ".XX.XXX.XX.",
    "XXXXXXXXXXX",
    "X.XXXXXXX.X",
    "X.X.....X.X",
    "...XX.XX...",
  ],
  [
    "..X.....X..",
    "X..X...X..X",
    "X.XXXXXXX.X",
    "XXX.XXX.XXX",
    "XXXXXXXXXXX",
    ".XXXXXXXXX.",
    "..X.....X..",
    ".X.......X.",
  ],
];

const EXPLOSION = [
  ".X...X...X.",
  "..X..X..X..",
  "...X...X...",
  "XX.......XX",
  "...X...X...",
  "..X..X..X..",
  ".X...X...X.",
  "...........",
];

const CANNON = [
  "......X......",
  ".....XXX.....",
  ".....XXX.....",
  ".XXXXXXXXXXX.",
  "XXXXXXXXXXXXX",
  "XXXXXXXXXXXXX",
  "XXXXXXXXXXXXX",
];

const PIXEL = 3;

function Sprite({ rows, className }: { rows: string[]; className?: string }) {
  const width = rows[0].length;
  return (
    <svg
      viewBox={`0 0 ${width} ${rows.length}`}
      width={width * PIXEL}
      height={rows.length * PIXEL}
      shapeRendering="crispEdges"
      className={className}
    >
      {rows.flatMap((row, y) =>
        [...row].map((pixel, x) =>
          pixel === "X" ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
          ) : null,
        ),
      )}
    </svg>
  );
}

type InvadersProps = {
  /** Number of questions in the round: one invader each. */
  total: number;
  /** Index of the question on screen; the cannon sits under its invader. */
  current: number;
  /** Results of the questions answered so far, in order. */
  results: readonly AnswerResult[];
};

/**
 * In-match progress indicator (STYLE_GUIDE: Invaders). A correct answer shoots
 * that question's invader down; a wrong answer or timeout leaves it standing,
 * one row closer to the cannon. Decorative: the question counter carries the
 * same information as text.
 */
export function Invaders({ total, current, results }: InvadersProps) {
  const column = (index: number) => `${((index + 0.5) / total) * 100}%`;
  const lastIndex = results.length - 1;
  const justHit = lastIndex === current && results[lastIndex] === "correct";

  return (
    <div
      aria-hidden="true"
      className="relative aspect-[3/1] w-full select-none border-2 border-term-border"
    >
      {Array.from({ length: total }, (_, index) => {
        const result = results[index];
        const missed = result === "wrong" || result === "no-answer";

        return (
          <div
            key={index}
            className={`absolute -translate-x-1/2 ${missed ? "top-6" : "top-3"}`}
            style={{ left: column(index) }}
          >
            {result === "correct" ? (
              // Appears when the shot lands; stays as debris.
              <Sprite rows={EXPLOSION} className="animate-invader-hit text-term-secondary" />
            ) : (
              <div className="relative">
                <Sprite rows={INVADER_FRAMES[0]} className="animate-invader-march text-term-primary" />
                <Sprite
                  rows={INVADER_FRAMES[1]}
                  className="invisible absolute inset-0 animate-invader-march-alt text-term-primary"
                />
              </div>
            )}
          </div>
        );
      })}

      {justHit ? (
        <span
          key={`shot-${current}`}
          className="absolute h-3 w-[3px] -translate-x-1/2 animate-invader-shot bg-term-primary"
          style={{ left: column(current) }}
        />
      ) : null}

      <div
        className="absolute bottom-2 -translate-x-1/2 text-term-primary"
        style={{ left: column(current) }}
      >
        <Sprite rows={CANNON} />
      </div>
    </div>
  );
}
