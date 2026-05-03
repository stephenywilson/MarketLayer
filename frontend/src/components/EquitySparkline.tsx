import type { BacktestEquityPoint } from "../api/client";

interface Props {
  points: BacktestEquityPoint[];
  height?: number;
}

export function EquitySparkline({ points, height = 160 }: Props) {
  if (points.length < 2) {
    return (
      <div
        className="ml-panel flex items-center justify-center text-[11px] text-ml-text-muted"
        style={{ height }}
      >
        Not enough points to render the equity curve.
      </div>
    );
  }

  const width = 720;
  const pad = 24;
  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.equity);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const yPad = (yMax - yMin) * 0.1 || 0.01;
  const yLo = yMin - yPad;
  const yHi = yMax + yPad;

  const sx = (i: number) =>
    pad + ((i - xMin) / Math.max(1, xMax - xMin)) * (width - pad * 2);
  const sy = (v: number) =>
    height - pad - ((v - yLo) / (yHi - yLo)) * (height - pad * 2);

  const linePts = points.map((p, i) => `${sx(i)},${sy(p.equity)}`).join(" ");
  const areaPts = `${pad},${height - pad} ${linePts} ${sx(points.length - 1)},${height - pad}`;

  const last = points[points.length - 1];
  const first = points[0];
  const total = first.equity ? (last.equity - first.equity) / first.equity : 0;
  const positive = total >= 0;

  return (
    <div className="ml-panel p-5">
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="ml-label">EQUITY INDEX (RESEARCH)</div>
          <div className="text-[11px] text-ml-text-muted mt-0.5">
            Compounded mean forward returns of emitted signals · base 1.0
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] text-ml-text-muted">
            Final
          </div>
          <div
            className={`font-mono text-xl ${
              positive ? "text-ml-accent" : "text-ml-danger"
            }`}
          >
            {last.equity.toFixed(4)}
          </div>
          <div
            className={`text-[11px] font-mono ${
              positive ? "text-ml-accent" : "text-ml-danger"
            }`}
          >
            {positive ? "+" : ""}
            {(total * 100).toFixed(2)}%
          </div>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        {/* baseline at 1.0 */}
        <line
          x1={pad}
          x2={width - pad}
          y1={sy(1.0)}
          y2={sy(1.0)}
          stroke="#2a323d"
          strokeDasharray="3 4"
        />
        <polygon points={areaPts} fill="rgba(100,206,155,0.08)" />
        <polyline
          points={linePts}
          fill="none"
          stroke={positive ? "#64CE9B" : "#F05252"}
          strokeWidth={1.5}
        />
        {/* y-axis labels */}
        <text
          x={4}
          y={sy(yHi) + 10}
          fill="#697080"
          fontSize="9"
          fontFamily="ui-monospace, Menlo, monospace"
        >
          {yHi.toFixed(3)}
        </text>
        <text
          x={4}
          y={sy(yLo) - 2}
          fill="#697080"
          fontSize="9"
          fontFamily="ui-monospace, Menlo, monospace"
        >
          {yLo.toFixed(3)}
        </text>
        <text
          x={pad + 4}
          y={sy(1.0) - 4}
          fill="#697080"
          fontSize="9"
          fontFamily="ui-monospace, Menlo, monospace"
        >
          1.000
        </text>
      </svg>
      <div className="flex justify-between text-[10px] font-mono text-ml-text-muted mt-2">
        <span>{first.date}</span>
        <span>{points[Math.floor(points.length / 2)].date}</span>
        <span>{last.date}</span>
      </div>
    </div>
  );
}
