/** A bitmap: one string per row, one character per pixel ("X" = lit). */
export type Bitmap = readonly string[];

/** The lit pixels of a bitmap as 1x1 rects, for use inside an <svg>. */
export function PixelRects({
  rows,
  x = 0,
  y = 0,
}: {
  rows: Bitmap;
  x?: number;
  y?: number;
}) {
  return rows.flatMap((row, dy) =>
    [...row].map((pixel, dx) =>
      pixel === "X" ? (
        <rect
          key={`${dx}-${dy}`}
          x={x + dx}
          y={y + dy}
          width={1}
          height={1}
          fill="currentColor"
        />
      ) : null,
    ),
  );
}

/** A standalone bitmap sprite, `scale` screen pixels per bitmap pixel. */
export function Sprite({
  rows,
  scale = 3,
  className,
}: {
  rows: Bitmap;
  scale?: number;
  className?: string;
}) {
  const width = rows[0].length;
  return (
    <svg
      viewBox={`0 0 ${width} ${rows.length}`}
      width={width * scale}
      height={rows.length * scale}
      shapeRendering="crispEdges"
      className={className}
    >
      <PixelRects rows={rows} />
    </svg>
  );
}
