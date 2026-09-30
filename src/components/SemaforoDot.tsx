import type { Semaforo } from "@/lib/types";

const LABELS: Record<Semaforo, string> = {
  g: "Verde",
  y: "Amarillo",
  r: "Rojo",
  x: "Sin puntuar",
};

const COLORS: Record<Semaforo, string> = {
  g: "bg-[var(--sem-g)]",
  y: "bg-[var(--sem-y)]",
  r: "bg-[var(--sem-r)]",
  x: "bg-[var(--sem-x)]",
};

export function SemaforoDot({
  value,
  size = "md",
  showLabel = false,
}: {
  value: Semaforo;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const dim =
    size === "sm" ? "h-2.5 w-2.5" : size === "lg" ? "h-4 w-4" : "h-3 w-3";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`${dim} rounded-full ${COLORS[value]} ring-1 ring-black/10 dark:ring-white/20`}
        title={LABELS[value]}
        aria-label={LABELS[value]}
      />
      {showLabel ? (
        <span className="text-sm text-[var(--muted)]">{LABELS[value]}</span>
      ) : null}
    </span>
  );
}
