"use client";

// Price over time for one token: a 2px line with a light area wash, solid hairline
// grid, round y-axis ticks, and a crosshair + tooltip that follows the pointer, or the
// arrow keys once the chart has focus. PriceSummary is its text twin.

import { KeyboardEvent, PointerEvent, useState } from "react";
import type { ChartRange, PricePoint } from "@/types/market";
import { useElementWidth } from "@/hooks/useElementWidth";
import { formatAxisTime, formatPointTime, formatTick, linePath, niceTicks, scaleLinear } from "@/utils/chart";
import { formatUsd } from "@/utils/format";
import { cn } from "@/lib/utils";

const HEIGHT = 260;
const MARGIN = { top: 16, right: 16, bottom: 28 };
const TICK_CHAR_WIDTH = 7.5;   // rough width of one 12px character, to fit the y-axis labels
const TOOLTIP_WIDTH = 150;

interface Props {
  points: PricePoint[];
  range: ChartRange;
  label: string;          // e.g. "SOL price", used for screen readers
  dimmed?: boolean;       // true while a new range loads: keep this chart, faded
}

export default function PriceChart({ points, range, label, dimmed = false }: Props) {
  const { ref, width } = useElementWidth();
  const [active, setActive] = useState<number | null>(null);

  if (points.length < 2) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Not enough data for this range yet.</p>;
  }

  const prices = points.map((point) => point.price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const padding = (high - low) * 0.1;
  const ticks = niceTicks(low - padding, high + padding, 4);
  const step = ticks.length > 1 ? ticks[1] - ticks[0] : high * 0.01;
  // Left margin fits the longest y-axis label (tiny prices like $0.0000040 are wide)
  const tickLabels = ticks.map((tick) => formatTick(tick, step));
  const longest = Math.max(...tickLabels.map((text) => text.length));
  const marginLeft = Math.ceil(longest * TICK_CHAR_WIDTH) + 12;

  const yMin = Math.min(ticks[0], low);
  const yMax = Math.max(ticks[ticks.length - 1], high);

  const plotBottom = HEIGHT - MARGIN.bottom;
  const plotRight = Math.max(marginLeft + 1, width - MARGIN.right);
  const x = scaleLinear(points[0].time, points[points.length - 1].time, marginLeft, plotRight);
  const y = scaleLinear(yMin, yMax, plotBottom, MARGIN.top);

  const coords = points.map((point) => ({ x: x(point.time), y: y(point.price) }));
  const line = linePath(coords);
  const last = coords.length - 1;
  const area = `${line} L${coords[last].x.toFixed(1)} ${plotBottom} L${coords[0].x.toFixed(1)} ${plotBottom} Z`;

  // Four evenly spaced time labels; the outer two hug the chart edges
  const timeTicks = [0, Math.floor(last / 3), Math.floor((2 * last) / 3), last];
  function anchorFor(position: number): "start" | "middle" | "end" {
    if (position === 0) return "start";
    if (position === timeTicks.length - 1) return "end";
    return "middle";
  }

  // The crosshair snaps to the nearest point, so readers aim at a time, not a thin line
  function nearestIndex(pointerX: number): number {
    let best = 0;
    for (let i = 1; i < coords.length; i++) {
      if (Math.abs(coords[i].x - pointerX) < Math.abs(coords[best].x - pointerX)) best = i;
    }
    return best;
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    setActive(nearestIndex(event.clientX - box.left));
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const current = active ?? last;
    let next = current;
    if (event.key === "ArrowLeft") next = Math.max(0, current - 1);
    else if (event.key === "ArrowRight") next = Math.min(last, current + 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    setActive(next);
  }

  const shown = active ?? last;
  const dot = coords[shown];
  const tooltipLeft = Math.min(Math.max(dot.x - TOOLTIP_WIDTH / 2, 0), Math.max(0, width - TOOLTIP_WIDTH));
  const summary = `${label}, ${range}: from ${formatUsd(prices[0])} to ${formatUsd(prices[last])}. High ${formatUsd(high)}, low ${formatUsd(low)}.`;

  return (
    <div ref={ref} className={cn("relative transition-opacity duration-200", dimmed && "opacity-50")}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          tabIndex={0}
          aria-label={`${summary} Use the left and right arrow keys to read prices.`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setActive(null)}
          onKeyDown={handleKeyDown}
          onFocus={() => setActive(last)}
          onBlur={() => setActive(null)}
          className="block touch-pan-y rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {/* Solid hairline grid with round dollar ticks */}
          {ticks.map((tick, i) => (
            <g key={tick}>
              <line x1={marginLeft} x2={plotRight} y1={y(tick)} y2={y(tick)} stroke="var(--border)" strokeWidth={1} />
              <text x={marginLeft - 8} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={12} fill="var(--muted-foreground)" className="tabular-nums">
                {tickLabels[i]}
              </text>
            </g>
          ))}
          {timeTicks.map((index, i) => (
            <text
              key={index}
              x={coords[index].x}
              y={HEIGHT - 8}
              fontSize={12}
              fill="var(--muted-foreground)"
              textAnchor={anchorFor(i)}
            >
              {formatAxisTime(points[index].time, range)}
            </text>
          ))}

          <path d={area} fill="var(--primary)" fillOpacity={0.1} />
          <path d={line} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {active !== null && (
            <line x1={dot.x} x2={dot.x} y1={MARGIN.top} y2={plotBottom} stroke="var(--muted-foreground)" strokeWidth={1} />
          )}
          {/* End (or hovered) point: 8px dot with a 2px ring in the card color */}
          <circle cx={dot.x} cy={dot.y} r={4} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
        </svg>
      )}

      {active !== null && (
        <div
          className="pointer-events-none absolute top-0 flex flex-col rounded-md border bg-popover px-2.5 py-1.5 shadow-md"
          style={{ left: tooltipLeft, width: TOOLTIP_WIDTH }} /* computed position: the one allowed inline style */
        >
          <span className="font-semibold tabular-nums">{formatUsd(points[shown].price)}</span>
          <span className="text-xs text-muted-foreground">{formatPointTime(points[shown].time)}</span>
        </div>
      )}

      {/* Announces the value under the crosshair for screen readers */}
      <p className="sr-only" aria-live="polite">
        {active !== null ? `${formatUsd(points[shown].price)} at ${formatPointTime(points[shown].time)}` : ""}
      </p>
    </div>
  );
}
