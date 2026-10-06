"use client";

// A row of toggle buttons for filtering a list, e.g. All / Open / Ended, with optional counts.
// Wraps onto a new line on narrow screens instead of scrolling sideways.

import { Button } from "@/components/ui/button";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface Props {
  label: string;          // what is being filtered, for screen readers
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function FilterButtons({ label, options, value, onChange }: Props) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Button
            key={option.value}
            variant={selected ? "secondary" : "ghost"}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="tabular-nums text-muted-foreground">{option.count}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
