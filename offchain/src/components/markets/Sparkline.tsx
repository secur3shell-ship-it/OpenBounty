// Small 7-day trend line. Decorative: the price and change beside it carry the numbers.

import { linePath, scaleLinear } from "@/utils/chart";
import { cn } from "@/lib/utils";

const WIDTH = 100;
const HEIGHT = 32;

interface Props {
  prices: number[];
  className?: string;
}

export default function Sparkline({ prices, className }: Props) {
  if (prices.length < 2) return null;

  const x = scaleLinear(0, prices.length - 1, 0, WIDTH);
  const y = scaleLinear(Math.min(...prices), Math.max(...prices), HEIGHT - 2, 2);
  const path = linePath(prices.map((price, i) => ({ x: x(i), y: y(price) })));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden
      className={cn("h-8 w-full", className)}
    >
      {/* non-scaling-stroke keeps the line 2px however wide the card is */}
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
