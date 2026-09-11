'use client';

/* Decorative connected-dots sparkline — the latest point gets a live pulse ring.
   The viewBox is padded beyond the plotted 0..w/0..h range so the pulse ring
   (which grows well past its resting radius) never gets clipped at the edge. */
export function Sparkline({ points, color = '#feb23b' }: { points: number[]; color?: string }) {
  const w = 96; const h = 40; const n = points.length;
  const xs = points.map((_, i) => (i / (n - 1)) * w);
  const ys = points.map((v) => h - v);
  const linePoints = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const lastX = xs[n - 1];
  const lastY = ys[n - 1];
  const pad = 10;

  return (
    <svg className="shrink-0" fill="none" height={h} viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`} width={w}>
      <polyline fill="none" opacity={0.5} points={linePoints} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      {xs.slice(0, -1).map((x, i) => (
        <circle cx={x} cy={ys[i]} fill={color} key={i} opacity={0.5} r={2} />
      ))}
      <circle className="metric-pulse-ring" cx={lastX} cy={lastY} fill={color} opacity={0.35} r={5} />
      <circle cx={lastX} cy={lastY} fill={color} r={3.5} />
    </svg>
  );
}
