// A labelled form field: label, the input (children), and helper text that an error replaces.
// Give the input `id={id}` and `aria-describedby={messageId(id)}` so both are announced.

import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function messageId(id: string): string {
  return `${id}-message`;
}

interface Props {
  id: string;
  label: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}

export default function FormField({ id, label, helper, error, children }: Props) {
  let message = null;
  if (error) {
    message = (
      <p id={messageId(id)} role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  } else if (helper) {
    message = (
      <p id={messageId(id)} className="text-sm text-muted-foreground">
        {helper}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {message}
    </div>
  );
}
