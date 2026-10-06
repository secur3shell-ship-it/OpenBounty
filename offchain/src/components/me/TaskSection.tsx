// A titled list of to-do items with a count. Renders nothing when the list is empty.

import { ReactNode } from "react";

interface Props {
  title: string;
  count: number;
  children: ReactNode;
}

export default function TaskSection({ title, count, children }: Props) {
  if (count === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl">
        {title} <span className="font-sans text-base tabular-nums text-muted-foreground">{count}</span>
      </h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}
