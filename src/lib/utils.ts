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

export type DurationUnit = "lifetime" | "hours" | "days" | "weeks" | "months" | "years";

const UNIT_TO_DAYS: Record<Exclude<DurationUnit, "lifetime">, number> = {
  hours: 1 / 24,
  days: 1,
  weeks: 7,
  months: 30,
  years: 365,
};

/** Convert (amount, unit) to fractional days for the backend. */
export function durationToDays(unit: DurationUnit, amount: number): number | null {
  if (unit === "lifetime") return null;
  return amount * UNIT_TO_DAYS[unit];
}

/** Pick the most natural (unit, amount) representation from a day count. */
export function daysToDuration(days: number | null | undefined): { unit: DurationUnit; amount: number } {
  if (days == null) return { unit: "lifetime", amount: 0 };
  if (days > 0 && days < 1) {
    return { unit: "hours", amount: Math.round(days * 24) };
  }
  if (days >= 365 && days % 365 === 0) return { unit: "years", amount: days / 365 };
  if (days >= 30 && days % 30 === 0) return { unit: "months", amount: days / 30 };
  if (days >= 7 && days % 7 === 0) return { unit: "weeks", amount: days / 7 };
  return { unit: "days", amount: days };
}

export function formatDuration(days: number | null | undefined): string {
  if (days == null) return "LIFETIME";
  const { unit, amount } = daysToDuration(days);
  const map: Record<Exclude<DurationUnit, "lifetime">, string> = {
    hours: "HR",
    days: "DAYS",
    weeks: "WK",
    months: "MO",
    years: "YR",
  };
  if (unit === "lifetime") return "LIFETIME";
  return `${amount}_${map[unit]}`;
}

