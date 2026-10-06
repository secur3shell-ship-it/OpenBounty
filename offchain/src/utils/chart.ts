// Small helpers for drawing charts in SVG: scales, round axis ticks, paths and labels.

import type { ChartRange, MarketQuote, PricePoint } from "@/types/market";

const HOUR_MS = 60 * 60 * 1000;
const RANGE_MS: Record<ChartRange, number> = { "1H": HOUR_MS, "24H": 24 * HOUR_MS, "7D": 7 * 24 * HOUR_MS, "30D": 30 * 24 * HOUR_MS };

// 24H and 7D charts are drawn from the hourly prices already in MarketQuote.sparkline;
// 1H and 30D fetch their own history
export function isSparklineRange(range: ChartRange): boolean {
  return range === "24H" || range === "7D";
}

// Chart points from a quote's 7-day hourly prices, plus the live price at the end, so
// the chart's last point always matches the price on the card
export function pointsFromSparkline(quote: MarketQuote, range: ChartRange): PricePoint[] {
  const end = quote.sparklineEndsAt.getTime();
  const last = quote.sparkline.length - 1;
  const points = quote.sparkline.map((price, i) => ({ time: end - (last - i) * HOUR_MS, price }));
  if (quote.updatedAt.getTime() > end || points.length === 0) {
    points.push({ time: quote.updatedAt.getTime(), price: quote.priceUsd });
  }
  const since = points[points.length - 1].time - RANGE_MS[range];
  return points.filter((point) => point.time >= since);
}

// Maps a value in [domainMin, domainMax] to a pixel in [rangeMin, rangeMax]
export function scaleLinear(domainMin: number, domainMax: number, rangeMin: number, rangeMax: number) {
  const span = domainMax - domainMin || 1;
  return (value: number) => rangeMin + ((value - domainMin) / span) * (rangeMax - rangeMin);
}

// About `count` round tick values covering [min, max], e.g. 120, 121, 122 or 0.9996, 0.9998
export function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || Math.abs(max) * 0.01 || 1;
  const rough = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const leftover = rough / magnitude;

  let step = magnitude;
  if (leftover > 5) step = 10 * magnitude;
  else if (leftover > 2) step = 5 * magnitude;
  else if (leftover > 1) step = 2 * magnitude;

  const ticks: number[] = [];
  for (let value = Math.floor(min / step) * step; value <= max + step / 2; value += step) {
    ticks.push(Number(value.toPrecision(12)));
  }
  return ticks;
}

// A dollar tick label with just enough decimals for the tick spacing: "$120", "$0.9998"
export function formatTick(value: number, step: number): string {
  const decimals = Math.min(10, Math.max(0, -Math.floor(Math.log10(step))));
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

// SVG path through points: "M10 20 L30 40 ..."
export function linePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

// X-axis label: times for short ranges, dates for long ones
export function formatAxisTime(time: number, range: ChartRange): string {
  const date = new Date(time);
  if (range === "1H" || range === "24H") {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Tooltip label: date and time
export function formatPointTime(time: number): string {
  return new Date(time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
