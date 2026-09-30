export const SECTION_KEYS = [
  "proposito",
  "negocio",
  "capital",
  "mercado",
  "impacto",
  "equipo",
  "storytelling",
  "bienestar",
  "resiliencia",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  proposito: "Founder y Propósito",
  negocio: "Negocio y Salud Financiera",
  capital: "Capital y Estructura",
  mercado: "Mercado y Ventana",
  impacto: "Impacto",
  equipo: "Equipo y Cultura",
  storytelling: "Storytelling",
  bienestar: "Bienestar y Liderazgo",
  resiliencia: "I+D",
};

export type Semaforo = "g" | "y" | "r" | "x";

export type SubVariable = {
  k: string;
  raw?: string;
  u?: string;
  score: number | null;
  sem: Semaforo;
  por?: string;
};

export type Section = {
  nombre: string;
  pregunta: string;
  semaforo: Semaforo;
  score: number | null;
  score_label?: string;
  veto?: boolean;
  subs: SubVariable[];
};

export type Founder = {
  iniciales: string;
  nombre: string;
  role: string;
  bio: string;
};

export type Caso = {
  modelo: string[];
  impacto: string[];
  founders: Founder[];
  links: { label: string; url: string }[];
};

export type Sponsor = {
  nombre: string;
  rol: string;
};

export type Conteo = {
  g: number;
  y: number;
  r: number;
  x: number;
};

export type ValidacionItem = {
  sn?: string;
  sn_label?: string;
  dim?: string;
  quote: string;
  ev?: string;
  autor: string;
  rol?: string;
  org?: string;
  fecha?: string;
};

export type Validacion = {
  expertos: ValidacionItem[];
  clientes: ValidacionItem[];
  inversionistas: ValidacionItem[];
};

export type Apuesta = {
  titulo: string;
  parrafos: string[];
  razones: string[];
  banderas: string[];
  condiciones: string[];
  senales: string[];
  veredicto: string;
};

export type Entendimiento = {
  id: string;
  empresa: string;
  periodo: string;
  fecha: string;
  vertical: string;
  total: number | null;
  semaforo_general: Semaforo;
  modo: string;
  diagnostico: string;
  conteo: Conteo;
  sponsor: Sponsor | null;
  caso: Caso;
  sections: Record<SectionKey, Section>;
  validacion: Validacion;
  apuesta: Apuesta;
  created_by_email: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type EntendimientoListItem = {
  id: string;
  empresa: string;
  fecha: string;
  vertical: string;
  total: number | null;
  semaforo_general: Semaforo;
  created_at: string;
  updated_at: string;
};

export type EntendimientoInput = {
  empresa: string;
  periodo?: string;
  fecha?: string;
  vertical?: string;
  total?: number | null;
  semaforo_general?: Semaforo;
  modo?: string;
  diagnostico?: string;
  conteo?: Partial<Conteo>;
  sponsor?: Sponsor | null;
  caso?: Partial<Caso>;
  sections?: Partial<Record<SectionKey, Section>>;
  validacion?: Partial<Validacion>;
  apuesta?: Partial<Apuesta>;
};

export function emptyCaso(): Caso {
  return { modelo: [], impacto: [], founders: [], links: [] };
}

export function emptyValidacion(): Validacion {
  return { expertos: [], clientes: [], inversionistas: [] };
}

export function emptyApuesta(): Apuesta {
  return {
    titulo: "",
    parrafos: [],
    razones: [],
    banderas: [],
    condiciones: [],
    senales: [],
    veredicto: "",
  };
}

export function emptySection(key: SectionKey): Section {
  return {
    nombre: SECTION_LABELS[key],
    pregunta: "",
    semaforo: "x",
    score: null,
    subs: [],
  };
}

export function emptySections(): Record<SectionKey, Section> {
  return Object.fromEntries(
    SECTION_KEYS.map((k) => [k, emptySection(k)]),
  ) as Record<SectionKey, Section>;
}
