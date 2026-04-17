import { Input, Label } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { DurationUnit } from "@/lib/utils";

const UNITS: { value: DurationUnit; label: string }[] = [
  { value: "lifetime", label: "LIFETIME" },
  { value: "hours", label: "HOURS" },
  { value: "days", label: "DAYS" },
  { value: "weeks", label: "WEEKS" },
  { value: "months", label: "MONTHS" },
  { value: "years", label: "YEARS" },
];

interface Props {
  unit: DurationUnit;
  amount: number;
  onChange: (next: { unit: DurationUnit; amount: number }) => void;
  label?: string;
}

export function DurationPicker({ unit, amount, onChange, label = "DURATION" }: Props) {
  const isLifetime = unit === "lifetime";
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="number"
          min={1}
          value={isLifetime ? "" : amount}
          disabled={isLifetime}
          placeholder={isLifetime ? "∞" : "1"}
          onChange={(e) =>
            onChange({ unit, amount: Math.max(1, Number(e.target.value) || 1) })
          }
          className="w-24 font-mono"
        />
        <div className="flex flex-1 flex-wrap gap-1">
          {UNITS.map((u) => (
            <button
              key={u.value}
              type="button"
              onClick={() =>
                onChange({
                  unit: u.value,
                  amount: u.value === "lifetime" ? 0 : amount || 1,
                })
              }
              className={cn(
                "px-2 py-1 rounded-sm border text-[10px] font-mono font-bold tracking-wider transition-colors",
                unit === u.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40",
              )}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
