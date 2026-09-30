import { randomUUID } from "crypto";
import { hasDatabaseUrl, query } from "./db";
import { importHtmlToEntendimiento } from "./html-import";
import type { NimbusIdentity } from "./identity";
import {
  type Apuesta,
  type Caso,
  type Entendimiento,
  type EntendimientoInput,
  type EntendimientoListItem,
  type Section,
  type SectionKey,
  type Semaforo,
  type Validacion,
  SECTION_KEYS,
  emptyApuesta,
  emptyCaso,
  emptySections,
  emptyValidacion,
} from "./types";

type Row = {
  id: string;
  empresa: string;
  periodo: string;
  fecha: string;
  vertical: string;
  total: number | null;
  semaforo_general: string;
  modo: string;
  diagnostico: string;
  conteo: Entendimiento["conteo"];
  sponsor: Entendimiento["sponsor"];
  caso: Caso;
  sections: Record<string, Section>;
  validacion: Validacion;
  apuesta: Apuesta;
  created_by_email: string | null;
  created_by_user_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function asIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function normalizeSections(
  raw: Record<string, Section> | null | undefined,
): Record<SectionKey, Section> {
  const base = emptySections();
  if (!raw) return base;
  for (const key of SECTION_KEYS) {
    if (raw[key]) base[key] = raw[key];
  }
  return base;
}

function rowToEntendimiento(row: Row): Entendimiento {
  return {
    id: row.id,
    empresa: row.empresa,
    periodo: row.periodo ?? "",
    fecha: row.fecha ?? "",
    vertical: row.vertical ?? "",
    total: row.total,
    semaforo_general: (row.semaforo_general as Semaforo) || "x",
    modo: row.modo ?? "",
    diagnostico: row.diagnostico ?? "",
    conteo: row.conteo ?? { g: 0, y: 0, r: 0, x: 0 },
    sponsor: row.sponsor ?? null,
    caso: row.caso ?? emptyCaso(),
    sections: normalizeSections(row.sections),
    validacion: row.validacion ?? emptyValidacion(),
    apuesta: row.apuesta ?? emptyApuesta(),
    created_by_email: row.created_by_email,
    created_by_user_id: row.created_by_user_id,
    created_at: asIso(row.created_at),
    updated_at: asIso(row.updated_at),
  };
}

function requireDb(): void {
  if (!hasDatabaseUrl()) {
    throw new Error(
      "No hay base de datos disponible todavía. Publicá la app para que Nimbus la conecte.",
    );
  }
}

export async function listEntendimientos(): Promise<EntendimientoListItem[]> {
  if (!hasDatabaseUrl()) return [];
  const res = await query<Row>(
    `SELECT id, empresa, fecha, vertical, total, semaforo_general, created_at, updated_at
     FROM entendimientos
     ORDER BY created_at DESC`,
  );
  return res.rows.map((r) => ({
    id: r.id,
    empresa: r.empresa,
    fecha: r.fecha ?? "",
    vertical: r.vertical ?? "",
    total: r.total,
    semaforo_general: (r.semaforo_general as Semaforo) || "x",
    created_at: asIso(r.created_at),
    updated_at: asIso(r.updated_at),
  }));
}

export async function getEntendimiento(
  id: string,
): Promise<Entendimiento | null> {
  if (!hasDatabaseUrl()) return null;
  const res = await query<Row>(
    `SELECT * FROM entendimientos WHERE id = $1`,
    [id],
  );
  const row = res.rows[0];
  return row ? rowToEntendimiento(row) : null;
}

export async function createEntendimiento(
  input: EntendimientoInput,
  identity?: NimbusIdentity,
): Promise<Entendimiento> {
  requireDb();
  const id = randomUUID();
  const sections = normalizeSections(
    input.sections as Record<string, Section> | undefined,
  );
  const caso: Caso = {
    ...emptyCaso(),
    ...(input.caso ?? {}),
    founders: (input.caso?.founders ?? []).map((f) => ({
      iniciales: f.iniciales ?? "",
      nombre: f.nombre ?? "",
      role: f.role ?? "",
      bio: f.bio ?? "",
    })),
  };
  const validacion: Validacion = {
    ...emptyValidacion(),
    ...(input.validacion ?? {}),
  };
  const apuesta: Apuesta = {
    ...emptyApuesta(),
    ...(input.apuesta ?? {}),
  };
  const conteo = {
    g: input.conteo?.g ?? 0,
    y: input.conteo?.y ?? 0,
    r: input.conteo?.r ?? 0,
    x: input.conteo?.x ?? 0,
  };

  const res = await query<Row>(
    `INSERT INTO entendimientos (
      id, empresa, periodo, fecha, vertical, total, semaforo_general, modo,
      diagnostico, conteo, sponsor, caso, sections, validacion, apuesta,
      created_by_email, created_by_user_id
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,
      $9,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb,
      $16,$17
    ) RETURNING *`,
    [
      id,
      input.empresa,
      input.periodo ?? "",
      input.fecha ?? "",
      input.vertical ?? "",
      input.total ?? null,
      input.semaforo_general ?? "x",
      input.modo ?? "",
      input.diagnostico ?? "",
      JSON.stringify(conteo),
      input.sponsor ? JSON.stringify(input.sponsor) : null,
      JSON.stringify(caso),
      JSON.stringify(sections),
      JSON.stringify(validacion),
      JSON.stringify(apuesta),
      identity?.email || null,
      identity?.userId || null,
    ],
  );
  return rowToEntendimiento(res.rows[0]);
}

export async function updateSection(
  id: string,
  sectionKey: SectionKey,
  patch: Partial<Section>,
): Promise<Entendimiento> {
  requireDb();
  if (!SECTION_KEYS.includes(sectionKey)) {
    throw new Error(`Sección inválida: ${sectionKey}`);
  }
  const current = await getEntendimiento(id);
  if (!current) throw new Error("Entendimiento no encontrado");

  const nextSection: Section = {
    ...current.sections[sectionKey],
    ...patch,
    subs: patch.subs ?? current.sections[sectionKey].subs,
  };
  const sections = { ...current.sections, [sectionKey]: nextSection };

  const res = await query<Row>(
    `UPDATE entendimientos
     SET sections = $2::jsonb, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, JSON.stringify(sections)],
  );
  return rowToEntendimiento(res.rows[0]);
}

export async function updateEntendimientoFields(
  id: string,
  patch: Partial<EntendimientoInput>,
): Promise<Entendimiento> {
  requireDb();
  const current = await getEntendimiento(id);
  if (!current) throw new Error("Entendimiento no encontrado");

  const next = {
    empresa: patch.empresa ?? current.empresa,
    periodo: patch.periodo ?? current.periodo,
    fecha: patch.fecha ?? current.fecha,
    vertical: patch.vertical ?? current.vertical,
    total: patch.total !== undefined ? patch.total : current.total,
    semaforo_general: patch.semaforo_general ?? current.semaforo_general,
    modo: patch.modo ?? current.modo,
    diagnostico: patch.diagnostico ?? current.diagnostico,
    conteo: { ...current.conteo, ...(patch.conteo ?? {}) },
    sponsor: patch.sponsor !== undefined ? patch.sponsor : current.sponsor,
    caso: { ...current.caso, ...(patch.caso ?? {}) },
    sections: patch.sections
      ? normalizeSections({ ...current.sections, ...patch.sections } as Record<
          string,
          Section
        >)
      : current.sections,
    validacion: { ...current.validacion, ...(patch.validacion ?? {}) },
    apuesta: { ...current.apuesta, ...(patch.apuesta ?? {}) },
  };

  const res = await query<Row>(
    `UPDATE entendimientos SET
      empresa=$2, periodo=$3, fecha=$4, vertical=$5, total=$6,
      semaforo_general=$7, modo=$8, diagnostico=$9,
      conteo=$10::jsonb, sponsor=$11::jsonb, caso=$12::jsonb,
      sections=$13::jsonb, validacion=$14::jsonb, apuesta=$15::jsonb,
      updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [
      id,
      next.empresa,
      next.periodo,
      next.fecha,
      next.vertical,
      next.total,
      next.semaforo_general,
      next.modo,
      next.diagnostico,
      JSON.stringify(next.conteo),
      next.sponsor ? JSON.stringify(next.sponsor) : null,
      JSON.stringify(next.caso),
      JSON.stringify(next.sections),
      JSON.stringify(next.validacion),
      JSON.stringify(next.apuesta),
    ],
  );
  return rowToEntendimiento(res.rows[0]);
}

export async function importHtmlAndCreate(
  html: string,
  identity?: NimbusIdentity,
): Promise<Entendimiento> {
  const parsed = importHtmlToEntendimiento(html);
  return createEntendimiento(parsed, identity);
}
