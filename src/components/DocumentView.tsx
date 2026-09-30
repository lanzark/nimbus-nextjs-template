import { SemaforoDot } from "@/components/SemaforoDot";
import {
  SECTION_KEYS,
  type Entendimiento,
  type ValidacionItem,
} from "@/lib/types";

function HtmlBlock({ html }: { html: string }) {
  if (!html) return null;
  return (
    <div
      className="prose-el text-[15px] leading-relaxed text-[var(--body)] [&_strong]:font-semibold [&_strong]:text-[var(--ink)]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ValidacionGroup({
  title,
  items,
}: {
  title: string;
  items: ValidacionItem[];
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
        {title}
      </h3>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li
            key={`${item.autor}-${i}`}
            className="border-l-2 border-[var(--mint)] pl-4"
          >
            {item.sn_label || item.dim ? (
              <div className="mb-1 flex flex-wrap gap-2 text-xs font-medium text-[var(--muted)]">
                {item.sn_label ? <span>{item.sn_label}</span> : null}
                {item.dim ? <span>· {item.dim}</span> : null}
              </div>
            ) : null}
            <blockquote className="text-[15px] leading-relaxed text-[var(--ink)]">
              “{item.quote}”
            </blockquote>
            {item.ev ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {item.ev}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-[var(--body)]">
              <span className="font-medium text-[var(--ink)]">{item.autor}</span>
              {item.rol ? ` · ${item.rol}` : ""}
              {item.fecha ? ` · ${item.fecha}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocumentView({ doc }: { doc: Entendimiento }) {
  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SemaforoDot value={doc.semaforo_general} size="lg" />
          {doc.total != null ? (
            <span className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
              {doc.total.toFixed(2)}
            </span>
          ) : null}
          <span className="text-sm text-[var(--muted)]">
            {doc.conteo.g} verdes · {doc.conteo.y} amarillos · {doc.conteo.r}{" "}
            rojos
          </span>
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            {doc.empresa}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
            {[doc.vertical, doc.fecha, doc.periodo].filter(Boolean).join(" · ")}
          </p>
          {doc.modo ? (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--body)]">
              {doc.modo}
            </p>
          ) : null}
          {doc.sponsor ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Sponsor:{" "}
              <span className="font-medium text-[var(--ink)]">
                {doc.sponsor.nombre}
              </span>
              {doc.sponsor.rol ? ` · ${doc.sponsor.rol}` : ""}
            </p>
          ) : null}
        </div>
      </header>

      {doc.diagnostico ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            Diagnóstico
          </h2>
          <HtmlBlock html={doc.diagnostico} />
        </section>
      ) : null}

      {(doc.caso.modelo.length > 0 ||
        doc.caso.impacto.length > 0 ||
        doc.caso.founders.length > 0) && (
        <section className="space-y-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            El caso
          </h2>
          {doc.caso.modelo.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                Modelo
              </h3>
              {doc.caso.modelo.map((p, i) => (
                <HtmlBlock key={i} html={p} />
              ))}
            </div>
          ) : null}
          {doc.caso.impacto.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                Impacto
              </h3>
              {doc.caso.impacto.map((p, i) => (
                <HtmlBlock key={i} html={p} />
              ))}
            </div>
          ) : null}
          {doc.caso.founders.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                Founders
              </h3>
              <ul className="grid gap-4 sm:grid-cols-2">
                {doc.caso.founders.map((f) => (
                  <li
                    key={f.iniciales + f.nombre}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-white">
                        {f.iniciales || "?"}
                      </span>
                      <div>
                        <div className="font-medium text-[var(--ink)]">
                          {f.nombre}
                        </div>
                        <div className="text-sm text-[var(--muted)]">
                          {f.role}
                        </div>
                      </div>
                    </div>
                    {f.bio ? (
                      <div className="mt-3">
                        <HtmlBlock html={f.bio} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}

      <section className="space-y-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
          Nueve dimensiones
        </h2>
        <div className="space-y-4">
          {SECTION_KEYS.map((key) => {
            const s = doc.sections[key];
            return (
              <div
                key={key}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <SemaforoDot value={s.semaforo} />
                      <h3 className="font-semibold text-[var(--ink)]">
                        {s.nombre}
                      </h3>
                    </div>
                    {s.pregunta ? (
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {s.pregunta}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    {s.score != null ? (
                      <div className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)]">
                        {s.score_label ?? s.score}
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--muted)]">—</div>
                    )}
                  </div>
                </div>
                {s.subs.length > 0 ? (
                  <ul className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
                    {s.subs.map((sub) => (
                      <li key={sub.k} className="text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <SemaforoDot value={sub.sem} size="sm" />
                          <span className="font-medium text-[var(--ink)]">
                            {sub.k}
                          </span>
                          {sub.raw ? (
                            <span className="text-[var(--muted)]">
                              {sub.raw}
                              {sub.u ?? ""}
                            </span>
                          ) : null}
                          {sub.score != null ? (
                            <span className="text-[var(--body)]">
                              · {sub.score}
                            </span>
                          ) : null}
                        </div>
                        {sub.por ? (
                          <div className="mt-1 pl-5">
                            <HtmlBlock html={sub.por} />
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {(doc.validacion.clientes.length > 0 ||
        doc.validacion.inversionistas.length > 0 ||
        doc.validacion.expertos.length > 0) && (
        <section className="space-y-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            Validación externa
          </h2>
          <ValidacionGroup title="Clientes" items={doc.validacion.clientes} />
          <ValidacionGroup
            title="Inversionistas"
            items={doc.validacion.inversionistas}
          />
          <ValidacionGroup title="Expertos" items={doc.validacion.expertos} />
        </section>
      )}

      {(doc.apuesta.titulo ||
        doc.apuesta.parrafos.length > 0 ||
        doc.apuesta.razones.length > 0) && (
        <section className="overflow-hidden rounded-2xl bg-[var(--ink)] p-6 text-white sm:p-8">
          <div className="inline-block rounded-md bg-[var(--mint)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)]">
            La apuesta
          </div>
          {doc.apuesta.titulo ? (
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug">
              {doc.apuesta.titulo}
            </h2>
          ) : null}
          <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-white/85">
            {doc.apuesta.parrafos.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {doc.apuesta.razones.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[var(--mint)]">
                Razones
              </h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-[15px] text-white/85">
                {doc.apuesta.razones.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {doc.apuesta.banderas.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[var(--mint)]">
                Banderas
              </h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-[15px] text-white/85">
                {doc.apuesta.banderas.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {doc.apuesta.condiciones.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[var(--mint)]">
                Condiciones precedentes
              </h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-[15px] text-white/85">
                {doc.apuesta.condiciones.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {doc.apuesta.senales.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[var(--mint)]">
                Señales
              </h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-[15px] text-white/85">
                {doc.apuesta.senales.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {doc.apuesta.veredicto ? (
            <p className="mt-6 border-t border-white/15 pt-4 text-sm text-white/75">
              {doc.apuesta.veredicto}
            </p>
          ) : null}
        </section>
      )}
    </article>
  );
}
