export function Pong() {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[2/1] w-full select-none border-2 border-term-border"
    >
      <span className="absolute top-1/2 left-1 h-8 w-1.5 -translate-y-1/2 bg-term-primary" />
      <span className="absolute top-1/2 right-1 h-8 w-1.5 -translate-y-1/2 bg-term-primary" />
      <span className="absolute top-1/2 h-4 w-4 -translate-y-1/2 animate-pong-bounce bg-term-primary" />
    </div>
  );
}
