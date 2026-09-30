import Link from "next/link";
import { SemaforoDot } from "@/components/SemaforoDot";
import { listEntendimientos } from "@/lib/entendimiento";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let items: Awaited<ReturnType<typeof listEntendimientos>> = [];
  let error: string | null = null;
  try {
    items = await listEntendimientos();
  } catch (e) {
    error = e instanceof Error ? e.message : "No se pudo cargar la lista.";
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
          Entendimientos
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
          Se arman en Claude con el conector de esta app. Cuando terminás, el
          expediente aparece acá para verlo y compartir el enlace con gente de
          Lucha.
        </p>
      </section>

      {error ? (
        <p className="rounded-xl border border-[var(--sem-y)]/40 bg-[var(--surface)] px-4 py-3 text-sm text-[var(--body)]">
          {error}
        </p>
      ) : null}

      {!error && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-12 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
            Todavía no hay expedientes
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)]">
            Armalo en Claude y aparece acá. Conectá{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 text-[0.85em] dark:bg-white/10">
              /api/mcp
            </code>{" "}
            y usá el prompt{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 text-[0.85em] dark:bg-white/10">
              armar-entendimiento
            </code>
            .
          </p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/e/${item.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <SemaforoDot value={item.semaforo_general} />
                    <span className="truncate font-medium text-[var(--ink)]">
                      {item.empresa}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">
                    {[item.vertical, item.fecha].filter(Boolean).join(" · ") ||
                      "Sin fecha"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {item.total != null ? (
                    <div className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
                      {item.total.toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--muted)]">—</div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
