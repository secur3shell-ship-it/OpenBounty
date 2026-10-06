"use client";

// Width of an element in pixels, kept up to date as it resizes. Charts use it to draw
// at the exact size (so lines stay 2px and text isn't stretched).

import { useCallback, useRef, useState } from "react";

export function useElementWidth() {
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);

  // Callback ref: attach with <div ref={ref}>
  const ref = useCallback((node: HTMLDivElement | null) => {
    observer.current?.disconnect();
    if (!node) return;
    observer.current = new ResizeObserver((entries) => {
      setWidth(Math.floor(entries[0].contentRect.width));
    });
    observer.current.observe(node);
  }, []);

  return { ref, width };
}
