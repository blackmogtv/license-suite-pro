import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date | null | undefined): string {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(days: number | null | undefined): string {
  if (days == null) return "LIFETIME";
  if (days >= 365 && days % 365 === 0) return `${days / 365}_YR`;
  if (days >= 30 && days % 30 === 0) return `${days / 30}_MO`;
  return `${days}_DAYS`;
}
