import { PixelRects } from "@/components/pixel-art";
import type { Bitmap } from "@/components/pixel-art";

// Scene grid: 128x64 pixels, scaled to the container width.
const WIDTH = 128;
const HEIGHT = 64;
const GROUND = 58;

const HAMMERER_UP: Bitmap = [
  "....XXX....X",
  "...XXXXX..XX",
  "..XXXXXXX.X.",
  "...X..X..X..",
  "...XXXX.X...",
  "..XXXXXX....",
  ".X.XXXX.....",
  ".X.XXXX.....",
  "...XXXX.....",
  "...X..X.....",
  "...X..X.....",
  "..XX..XX....",
];

const HAMMERER_DOWN: Bitmap = [
  "....XXX.....",
  "...XXXXX....",
  "..XXXXXXX...",
  "...X..X.....",
  "...XXXX.....",
  "..XXXXXXX...",
  ".X.XXXX..X..",
  ".X.XXXX..X..",
  "...XXXX.XXX.",
  "...X..X.XXX.",
  "...X..X.....",
  "..XX..XX....",
];

const CARRIER_BODY: Bitmap = [
  "..XXX.....",
  ".XXXXX....",
  "XXXXXXX...",
  ".X..X.....",
  ".XXXX.....",
  "XXXXXXXXXX",
  ".XXXXXXXXX",
  ".XXXX.XXXX",
  ".XXXX.XXXX",
  ".X..X.....",
  ".X..X.....",
];

const CARRIER_LEGS_APART: Bitmap = ["X....X....", "X....X...."];
const CARRIER_LEGS_TOGETHER: Bitmap = [".X..X.....", ".XX.XX...."];

const CONE: Bitmap = ["..XX..", "..XX..", ".X..X.", ".XXXX.", "X....X", "XXXXXX"];

/** Half-built server rack: finished units below, scaffolding on top. */
function Building() {
  const left = 66;
  const right = 97;
  const slab = 30;
  const units = [0, 1, 2, 3, 4, 5];

  return (
    <g className="text-term-primary">
      <rect x={left} y={slab} width={1} height={GROUND - slab} fill="currentColor" />
      <rect x={right} y={slab} width={1} height={GROUND - slab} fill="currentColor" />
      <rect x={left} y={slab} width={right - left + 1} height={1} fill="currentColor" />
      {units.map((unit) => {
        const y = slab + 3 + unit * 4;
        return (
          <g key={unit}>
            {/* rack unit with a gap for its status LED */}
            <rect x={left + 2} y={y} width={22} height={2} fill="currentColor" />
            <rect x={left + 26} y={y} width={4} height={2} fill="currentColor" />
          </g>
        );
      })}
      {/* scaffolding for the floor being built */}
      <g className="text-term-secondary">
        <rect x={left} y={slab - 10} width={1} height={10} fill="currentColor" />
        <rect x={right} y={slab - 10} width={1} height={10} fill="currentColor" />
        <rect x={left} y={slab - 10} width={right - left + 1} height={1} fill="currentColor" />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={left + 22 + i} y={slab - 1 - i} width={1} height={1} fill="currentColor" />
        ))}
      </g>
    </g>
  );
}

/** Tower crane lowering a rack unit onto the building. */
function Crane() {
  const mastLeft = 110;
  const jibTop = 6;
  const hookX = 86;

  return (
    <g>
      <g className="text-term-secondary">
        {/* mast */}
        <rect x={mastLeft} y={jibTop} width={1} height={GROUND - jibTop} fill="currentColor" />
        <rect x={mastLeft + 3} y={jibTop} width={1} height={GROUND - jibTop} fill="currentColor" />
        {Array.from({ length: 13 }, (_, i) => (
          <rect key={`m${i}`} x={mastLeft + 1} y={jibTop + 2 + i * 4} width={2} height={1} fill="currentColor" />
        ))}
        <rect x={mastLeft + 1} y={jibTop - 3} width={2} height={3} fill="currentColor" />
        {/* jib + counterweight */}
        <rect x={56} y={jibTop} width={68} height={1} fill="currentColor" />
        <rect x={56} y={jibTop + 3} width={68} height={1} fill="currentColor" />
        {Array.from({ length: 17 }, (_, i) => (
          <rect key={`j${i}`} x={57 + i * 4} y={jibTop + 1} width={1} height={2} fill="currentColor" />
        ))}
        <rect x={116} y={jibTop + 4} width={8} height={5} fill="currentColor" />
        {/* trolley */}
        <rect x={hookX - 3} y={jibTop + 4} width={7} height={2} fill="currentColor" />
      </g>

      <clipPath id="construction-cable">
        <rect x={0} y={jibTop + 6} width={WIDTH} height={HEIGHT} />
      </clipPath>
      <g clipPath="url(#construction-cable)">
        <g className="animate-site-hoist">
          <rect x={hookX} y={-30} width={1} height={44} fill="currentColor" className="text-term-secondary" />
          <g className="text-term-primary">
            <rect x={hookX - 1} y={14} width={3} height={1} fill="currentColor" />
            {/* rack unit on the hook */}
            <rect x={hookX - 7} y={15} width={15} height={1} fill="currentColor" />
            <rect x={hookX - 7} y={18} width={15} height={1} fill="currentColor" />
            <rect x={hookX - 7} y={15} width={1} height={4} fill="currentColor" />
            <rect x={hookX + 7} y={15} width={1} height={4} fill="currentColor" />
            <rect x={hookX + 4} y={16} width={2} height={2} fill="currentColor" />
          </g>
        </g>
      </g>
    </g>
  );
}

/**
 * Placeholder scene for features that aren't built yet (STYLE_GUIDE:
 * Construction site): a pixel-art tech construction site with mini builders.
 * Takes Pong's place in the hero slot; decorative only.
 */
export function ConstructionSite() {
  return (
    <div aria-hidden="true" className="w-full select-none border-2 border-term-border">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        shapeRendering="crispEdges"
        className="block h-auto w-full"
      >
        {/* dashed ground line */}
        <g className="text-term-border">
          {Array.from({ length: WIDTH / 4 }, (_, i) => (
            <rect key={i} x={i * 4} y={GROUND} width={2} height={1} fill="currentColor" />
          ))}
        </g>

        <Crane />
        <Building />

        {/* builder hammering on the top floor */}
        <g className="text-term-primary">
          <g className="animate-site-frame-a">
            <PixelRects rows={HAMMERER_UP} x={67} y={18} />
          </g>
          <g className="invisible animate-site-frame-b">
            <PixelRects rows={HAMMERER_DOWN} x={67} y={18} />
          </g>
        </g>

        {/* builder carrying a part across the site */}
        <g className="animate-site-walk text-term-primary [transform-box:fill-box] [transform-origin:center]">
          <PixelRects rows={CARRIER_BODY} x={8} y={GROUND - 13} />
          <g className="animate-site-frame-a">
            <PixelRects rows={CARRIER_LEGS_APART} x={8} y={GROUND - 2} />
          </g>
          <g className="invisible animate-site-frame-b">
            <PixelRects rows={CARRIER_LEGS_TOGETHER} x={8} y={GROUND - 2} />
          </g>
        </g>

        <g className="text-term-primary">
          <PixelRects rows={CONE} x={54} y={GROUND - 6} />
        </g>
      </svg>
    </div>
  );
}
