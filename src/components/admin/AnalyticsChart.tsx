"use client";

import { useId, useMemo, useState } from "react";

export type ChartPoint = { label: string; value: number };

type AnalyticsChartProps = {
  points: ChartPoint[];
  /** Bars for discrete period totals, line for a trend. */
  variant?: "line" | "bar";
  /** Counts render as integers; currency gets thousands separators. */
  format?: "number" | "currency";
  /** Accessible name — the surrounding card heading names the single series. */
  label: string;
  emptyMessage?: string;
};

const VIEW_WIDTH = 540;
const VIEW_HEIGHT = 260;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const BASELINE = 224;

/**
 * Rounds an axis maximum up to a readable step (1/2/5 × 10ⁿ).
 *
 * The previous axis divided the raw maximum into quarters, so a chart topping out at 1 order
 * printed "1, 1, 1, 0, 0" — five ticks, three of them duplicates. Snapping to a nice step and
 * forcing whole numbers for counts keeps every tick distinct and meaningful.
 */
const niceAxis = (maxValue: number, integerOnly: boolean): { max: number; ticks: number[] } => {
  const TICK_COUNT = 4;

  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return { max: integerOnly ? 4 : 1, ticks: integerOnly ? [4, 3, 2, 1, 0] : [1, 0.75, 0.5, 0.25, 0] };
  }

  const rawStep = maxValue / TICK_COUNT;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceMultiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  let step = niceMultiplier * magnitude;
  if (integerOnly) step = Math.max(1, Math.ceil(step));

  const max = step * TICK_COUNT;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, index) => max - index * step);

  return { max, ticks };
};

const formatTick = (value: number, format: "number" | "currency") => {
  if (format === "currency") {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
    return String(Math.round(value));
  }
  return String(Math.round(value));
};

const formatValue = (value: number, format: "number" | "currency") =>
  format === "currency" ? `Npr ${Math.round(value).toLocaleString()}` : String(Math.round(value));

/** Keeps the x-axis to at most eight labels so they never overlap. */
const labelStride = (count: number) => Math.max(1, Math.ceil(count / 8));

export function AnalyticsChart({
  points,
  variant = "line",
  format = "number",
  label,
  emptyMessage = "No data in this period yet.",
}: AnalyticsChartProps) {
  const gradientId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const integerOnly = format === "number";
  const maxValue = useMemo(() => Math.max(...points.map((point) => point.value), 0), [points]);
  const { max: axisMax, ticks } = useMemo(() => niceAxis(maxValue, integerOnly), [maxValue, integerOnly]);

  const hasData = points.length > 0 && points.some((point) => point.value > 0);

  const plotWidth = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = BASELINE - PAD_TOP;

  const xFor = (index: number) =>
    points.length <= 1
      ? PAD_LEFT + plotWidth / 2
      : PAD_LEFT + (index * plotWidth) / (points.length - 1);

  const yFor = (value: number) => BASELINE - (value / axisMax) * plotHeight;

  const linePath = points.map((point, index) => `${xFor(index)},${yFor(point.value)}`).join(" ");
  const areaPath = hasData
    ? `${PAD_LEFT},${BASELINE} ${linePath} ${xFor(points.length - 1)},${BASELINE}`
    : "";

  const slotWidth = points.length ? plotWidth / points.length : plotWidth;
  const barWidth = Math.max(3, Math.min(34, slotWidth * 0.6));

  if (!hasData) {
    return <div className="admin-chart-empty">{emptyMessage}</div>;
  }

  const active = activeIndex !== null ? points[activeIndex] : null;

  return (
    <figure className="admin-chart" aria-label={label}>
      <div className="admin-chart-plot">
        <div className="admin-chart-y-axis" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={`tick-${tick}`}>{formatTick(tick, format)}</span>
          ))}
        </div>

        <div className="admin-chart-canvas">
          <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label={label} preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Recessive gridlines, one per axis tick so labels and lines agree. */}
            {ticks.map((tick) => (
              <line
                key={`grid-${tick}`}
                className="admin-chart-grid"
                x1={PAD_LEFT}
                x2={VIEW_WIDTH - PAD_RIGHT}
                y1={yFor(tick)}
                y2={yFor(tick)}
              />
            ))}

            {variant === "bar" ? (
              points.map((point, index) => {
                const barHeight = Math.max(0, BASELINE - yFor(point.value));
                const centre =
                  points.length <= 1
                    ? PAD_LEFT + plotWidth / 2
                    : PAD_LEFT + index * slotWidth + slotWidth / 2;

                return (
                  <rect
                    key={`bar-${point.label}-${index}`}
                    className={activeIndex === index ? "admin-chart-bar active" : "admin-chart-bar"}
                    x={centre - barWidth / 2}
                    y={yFor(point.value)}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    ry={4}
                  />
                );
              })
            ) : (
              <>
                <polyline className="admin-chart-area" points={areaPath} fill={`url(#${gradientId})`} />
                <polyline className="admin-chart-line" points={linePath} />
                {points.map((point, index) => (
                  <circle
                    key={`dot-${point.label}-${index}`}
                    className={activeIndex === index ? "admin-chart-dot active" : "admin-chart-dot"}
                    cx={xFor(index)}
                    cy={yFor(point.value)}
                    r={activeIndex === index ? 6 : 4}
                  />
                ))}
              </>
            )}

            {/* Full-height hit targets so hovering anywhere in a column works. */}
            {points.map((point, index) => {
              const centre =
                variant === "bar"
                  ? PAD_LEFT + index * slotWidth + slotWidth / 2
                  : xFor(index);
              const hitWidth = Math.max(slotWidth, plotWidth / Math.max(points.length, 1));

              return (
                <rect
                  key={`hit-${point.label}-${index}`}
                  className="admin-chart-hit"
                  x={centre - hitWidth / 2}
                  y={0}
                  width={hitWidth}
                  height={BASELINE}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              );
            })}
          </svg>

          {active ? (
            <div
              className="admin-chart-tooltip"
              style={{
                left: `${((variant === "bar"
                  ? PAD_LEFT + (activeIndex ?? 0) * slotWidth + slotWidth / 2
                  : xFor(activeIndex ?? 0)) /
                  VIEW_WIDTH) *
                  100}%`,
              }}
              role="status"
            >
              <strong>{active.label}</strong>
              <span>{formatValue(active.value, format)}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="admin-chart-x-axis" aria-hidden="true">
        {points.map((point, index) => (
          <span key={`x-${point.label}-${index}`} className={index % labelStride(points.length) === 0 ? undefined : "hidden"}>
            {point.label}
          </span>
        ))}
      </div>
    </figure>
  );
}
