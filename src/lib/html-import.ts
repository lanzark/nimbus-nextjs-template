import {
  type Apuesta,
  type Caso,
  type EntendimientoInput,
  type Founder,
  type Section,
  type SectionKey,
  type Semaforo,
  type Validacion,
  type ValidacionItem,
  SECTION_KEYS,
  emptyApuesta,
  emptyCaso,
  emptySections,
  emptyValidacion,
} from "./types";

const ENTITY_MAP: Record<string, string> = {
  "&middot;": "·",
  "&ntilde;": "ñ",
  "&Ntilde;": "Ñ",
  "&aacute;": "á",
  "&eacute;": "é",
  "&iacute;": "í",
  "&oacute;": "ó",
  "&uacute;": "ú",
  "&Aacute;": "Á",
  "&Eacute;": "É",
  "&Iacute;": "Í",
  "&Oacute;": "Ó",
  "&Uacute;": "Ú",
  "&uuml;": "ü",
  "&Uuml;": "Ü",
  "&iquest;": "¿",
  "&iexcl;": "¡",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
  "&geq;": "≥",
  "&rarr;": "→",
  "&times;": "×",
};

function decodeEntities(input: string): string {
  return input.replace(/&[a-zA-Z]+;|&#\d+;|&#x[0-9a-fA-F]+;/g, (m) => {
    if (ENTITY_MAP[m]) return ENTITY_MAP[m];
    if (m.startsWith("&#x")) {
      const n = Number.parseInt(m.slice(3, -1), 16);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    if (m.startsWith("&#")) {
      const n = Number.parseInt(m.slice(2, -1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return m;
  });
}

function extractConstObject(source: string, name: string): string | null {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*\\{`);
  const match = re.exec(source);
  if (!match || match.index === undefined) return null;
  const start = match.index + match[0].length - 1;
  let depth = 0;
  let inStr: '"' | "'" | "`" | null = null;
  let escaped = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (inStr) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

function evalObjectLiteral(literal: string): unknown {
  // Trusted content from the author via Claude / HTML plantilla — not end-user HTML forms.
  return new Function(`"use strict"; return (${literal});`)();
}

function asSemaforo(v: unknown): Semaforo {
  return v === "g" || v === "y" || v === "r" || v === "x" ? v : "x";
}

function stripFoto<T extends Record<string, unknown>>(obj: T): Omit<T, "foto_b64"> {
  const copy = { ...obj };
  delete copy.foto_b64;
  return copy;
}

function normalizeFounder(raw: Record<string, unknown>): Founder {
  const clean = stripFoto(raw);
  return {
    iniciales: String(clean.iniciales ?? ""),
    nombre: decodeEntities(String(clean.nombre ?? "")),
    role: decodeEntities(String(clean.role ?? "")),
    bio: decodeEntities(String(clean.bio ?? "")),
  };
}

function normalizeSection(raw: Record<string, unknown>): Section {
  const subsRaw = Array.isArray(raw.subs) ? raw.subs : [];
  return {
    nombre: decodeEntities(String(raw.nombre ?? "")),
    pregunta: decodeEntities(String(raw.pregunta ?? "")),
    semaforo: asSemaforo(raw.semaforo),
    score: typeof raw.score === "number" ? raw.score : null,
    score_label: raw.score_label ? decodeEntities(String(raw.score_label)) : undefined,
    veto: Boolean(raw.veto),
    subs: subsRaw.map((s) => {
      const sub = (s ?? {}) as Record<string, unknown>;
      return {
        k: String(sub.k ?? ""),
        raw: sub.raw !== undefined ? decodeEntities(String(sub.raw)) : undefined,
        u: sub.u !== undefined ? decodeEntities(String(sub.u)) : undefined,
        score: typeof sub.score === "number" ? sub.score : null,
        sem: asSemaforo(sub.sem),
        por: sub.por !== undefined ? decodeEntities(String(sub.por)) : undefined,
      };
    }),
  };
}

function normalizeValidacionItem(raw: Record<string, unknown>): ValidacionItem {
  return {
    sn: raw.sn ? String(raw.sn) : undefined,
    sn_label: raw.sn_label
      ? decodeEntities(String(raw.sn_label))
      : undefined,
    dim: raw.dim ? decodeEntities(String(raw.dim)) : undefined,
    quote: decodeEntities(String(raw.quote ?? "")),
    ev: raw.ev ? decodeEntities(String(raw.ev)) : undefined,
    autor: decodeEntities(String(raw.autor ?? "")),
    rol: raw.rol ? decodeEntities(String(raw.rol)) : undefined,
    org: raw.org ? decodeEntities(String(raw.org)) : undefined,
    fecha: raw.fecha ? String(raw.fecha) : undefined,
  };
}

function extractApuesta(html: string): Apuesta {
  const blockMatch = html.match(
    /<div[^>]*class="apuesta"[^>]*id="apuesta"[^>]*>([\s\S]*?)<\/div>\s*<div class="section" id="deal"/,
  );
  const block = blockMatch?.[1] ?? "";
  if (!block) return emptyApuesta();

  const tituloMatch = block.match(/<h2>([\s\S]*?)<\/h2>/);
  const titulo = decodeEntities(
    (tituloMatch?.[1] ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );

  const parrafos = [...block.matchAll(/<p(?![^>]*style="margin-bottom:10px")[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()))
    .filter((t) => t && !t.startsWith("Cuatro razones") && !t.startsWith("Y hay cuatro") && !t.startsWith("Cuatro señales") && !t.startsWith("Dos salvedades") && !t.startsWith("Antes de desembolsar") && !t.startsWith("Las tres primeras"));

  const listBlocks = [...block.matchAll(/<ul[^>]*>([\s\S]*?)<\/ul>/g)].map((m) => m[1]);
  const listItems = (idx: number) => {
    const htmlList = listBlocks[idx] ?? "";
    return [...htmlList.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) =>
      decodeEntities(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()),
    );
  };

  const razones = listItems(0);
  const banderas = listItems(1);
  const senales = listItems(2);

  const condiciones = [
    ...block.matchAll(/class="cp-txt"><strong>([\s\S]*?)<\/strong>([\s\S]*?)<\/span>/g),
  ].map((m) =>
    decodeEntities(
      `${m[1]}${m[2]}`.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    ),
  );

  const veredictoMatch = block.match(/class="ticket">([\s\S]*?)<\/span>/);
  const veredicto = veredictoMatch
    ? decodeEntities(
        veredictoMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      )
    : "";

  return {
    titulo,
    parrafos: parrafos.slice(0, 12),
    razones,
    banderas,
    condiciones,
    senales,
    veredicto,
  };
}

export function importHtmlToEntendimiento(html: string): EntendimientoInput {
  const decodedSource = html;

  const dataLit = extractConstObject(decodedSource, "DATA");
  const sectionsLit = extractConstObject(decodedSource, "SECTIONS");
  const casoLit = extractConstObject(decodedSource, "CASO");
  const validacionLit = extractConstObject(decodedSource, "VALIDACION_EXTERNA");

  if (!dataLit) {
    throw new Error("No encontré const DATA en el HTML.");
  }
  if (!sectionsLit) {
    throw new Error("No encontré const SECTIONS en el HTML.");
  }

  const data = evalObjectLiteral(dataLit) as Record<string, unknown>;
  const sectionsRaw = evalObjectLiteral(sectionsLit) as Record<
    string,
    Record<string, unknown>
  >;
  const casoRaw = casoLit
    ? (evalObjectLiteral(casoLit) as Record<string, unknown>)
    : null;
  const validacionRaw = validacionLit
    ? (evalObjectLiteral(validacionLit) as Record<string, unknown>)
    : null;

  const sections = emptySections();
  for (const key of SECTION_KEYS) {
    if (sectionsRaw[key]) {
      sections[key] = normalizeSection(sectionsRaw[key]);
    }
  }

  let caso: Caso = emptyCaso();
  if (casoRaw) {
    const foundersRaw = Array.isArray(casoRaw.founders) ? casoRaw.founders : [];
    caso = {
      modelo: (Array.isArray(casoRaw.modelo) ? casoRaw.modelo : []).map((s) =>
        decodeEntities(String(s)),
      ),
      impacto: (Array.isArray(casoRaw.impacto) ? casoRaw.impacto : []).map((s) =>
        decodeEntities(String(s)),
      ),
      founders: foundersRaw.map((f) =>
        normalizeFounder((f ?? {}) as Record<string, unknown>),
      ),
      links: Array.isArray(casoRaw.links)
        ? (casoRaw.links as { label?: string; url?: string }[]).map((l) => ({
            label: String(l.label ?? ""),
            url: String(l.url ?? ""),
          }))
        : [],
    };
  }

  let validacion: Validacion = emptyValidacion();
  if (validacionRaw) {
    const mapList = (key: keyof Validacion) =>
      (Array.isArray(validacionRaw[key]) ? validacionRaw[key] : []).map((item) =>
        normalizeValidacionItem((item ?? {}) as Record<string, unknown>),
      );
    validacion = {
      expertos: mapList("expertos"),
      clientes: mapList("clientes"),
      inversionistas: mapList("inversionistas"),
    };
  }

  const sponsorRaw = data.sponsor as Record<string, unknown> | undefined;
  const sponsor = sponsorRaw
    ? {
        nombre: decodeEntities(String(sponsorRaw.nombre ?? "")),
        rol: decodeEntities(String(sponsorRaw.rol ?? "")),
      }
    : null;

  const conteoRaw = (data.conteo ?? {}) as Record<string, unknown>;

  return {
    empresa: decodeEntities(String(data.empresa ?? "Sin nombre")),
    periodo: decodeEntities(String(data.periodo ?? "")),
    fecha: String(data.fecha ?? ""),
    vertical: decodeEntities(String(data.vertical ?? "")),
    total: typeof data.total === "number" ? data.total : null,
    semaforo_general: asSemaforo(data.semaforo_general),
    modo: decodeEntities(String(data.modo ?? "")),
    diagnostico: decodeEntities(String(data.diagnostico ?? "")),
    conteo: {
      g: Number(conteoRaw.g ?? 0),
      y: Number(conteoRaw.y ?? 0),
      r: Number(conteoRaw.r ?? 0),
      x: Number(conteoRaw.x ?? 0),
    },
    sponsor,
    caso,
    sections,
    validacion,
    apuesta: extractApuesta(decodedSource),
  };
}

export function mergeSectionUpdate(
  current: Section,
  patch: Partial<Section>,
): Section {
  return {
    ...current,
    ...patch,
    subs: patch.subs ?? current.subs,
  };
}

export type { SectionKey };
