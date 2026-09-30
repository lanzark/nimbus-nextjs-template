import { AsyncLocalStorage } from "async_hooks";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  createEntendimiento,
  getEntendimiento,
  importHtmlAndCreate,
  listEntendimientos,
  updateEntendimientoFields,
  updateSection,
} from "@/lib/entendimiento";
import { identityFromRequest, type NimbusIdentity } from "@/lib/identity";
import { SECTION_KEYS } from "@/lib/types";

const identityStore = new AsyncLocalStorage<NimbusIdentity>();

function currentIdentity(): NimbusIdentity | undefined {
  return identityStore.getStore();
}

function jsonResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(message: string) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: message }],
  };
}

const SKILL_INSTRUCTIONS = `Sos el asistente de Entendimiento Luchante (LUCHA).

Flujo:
1. Quien arma el expediente lo hace conversando con vos (Claude), no en un formulario de la app.
2. Cuando el expediente está completo, usás crear_entendimiento (o importar_html) y queda cargado en la app.
3. La persona copia el enlace de la app y lo comparte con gente de Lucha. Ellos ven el documento y conectan este mismo MCP en su Claude para cuestionarlo.

Reglas:
- Trabajá por secciones: cabecera, diagnóstico, caso, las 9 dimensiones (proposito, negocio, capital, mercado, impacto, equipo, storytelling, bienestar, resiliencia), validación externa, apuesta.
- Pedí una sección a la vez. No inventes scores ni semáforos: pedí evidencia.
- Semáforos: g=verde, y=amarillo, r=rojo, x=sin puntuar.
- Al importar HTML de plantilla vigente, usá importar_html (tira fotos en base64).
- No hay chat en la página de la app. No guardes comentarios del partner: solo lectura y conversación en Claude.
- Prompts disponibles: armar-entendimiento y revisar-entendimiento.`;

const sectionKeySchema = z.enum(SECTION_KEYS);

const subSchema = z.object({
  k: z.string(),
  raw: z.string().optional(),
  u: z.string().optional(),
  score: z.number().nullable().optional(),
  sem: z.enum(["g", "y", "r", "x"]).optional(),
  por: z.string().optional(),
});

const sectionSchema = z.object({
  nombre: z.string().optional(),
  pregunta: z.string().optional(),
  semaforo: z.enum(["g", "y", "r", "x"]).optional(),
  score: z.number().nullable().optional(),
  score_label: z.string().optional(),
  veto: z.boolean().optional(),
  subs: z.array(subSchema).optional(),
});

const handler = createMcpHandler(
  (server) => {
    server.registerPrompt(
      "armar-entendimiento",
      {
        title: "Armar entendimiento",
        description:
          "Guía para armar un expediente de Entendimiento Luchante sección por sección y guardarlo en la app al terminar.",
        argsSchema: z.object({
          empresa: z
            .string()
            .optional()
            .describe("Nombre de la empresa si ya se conoce"),
        }),
      },
      ({ empresa }) => ({
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Quiero armar un Entendimiento Luchante${empresa ? ` para ${empresa}` : ""}.

Seguí el skill del servidor:
1. Empezá por cabecera (empresa, fecha, vertical, sponsor) y diagnóstico.
2. Completá el caso (modelo, impacto, founders sin fotos).
3. Recorré las 9 dimensiones una por una con score, semáforo y subvariables.
4. Cargá validación externa (citas con evidencia y vínculo declarado).
5. Cerrá con la apuesta (razones, banderas, condiciones, señales).
6. Cuando esté listo, llamá crear_entendimiento y devolveme el id y el enlace /e/{id}.

Si tengo un HTML de plantilla vigente, usá importar_html en lugar de cargar todo a mano.
No inventes números. Si falta evidencia, dejá semáforo x o pedila.`,
            },
          },
        ],
      }),
    );

    server.registerPrompt(
      "revisar-entendimiento",
      {
        title: "Revisar entendimiento",
        description:
          "Lee un expediente existente y ayuda a cuestionarlo. No guarda comentarios en la app.",
        argsSchema: z.object({
          id: z.string().describe("UUID del entendimiento"),
        }),
      },
      ({ id }) => ({
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Quiero revisar el entendimiento ${id}.

1. Usá leer_entendimiento con ese id.
2. Ayudame a cuestionar el documento: contradicciones, evidencia débil, banderas, qué falta para decidir.
3. No guardes comentarios en la app: esta conversación vive solo acá en Claude.
4. Si pedís cambios de fondo, sugerí el texto; quien arma puede aplicarlos con actualizar_seccion.`,
            },
          },
        ],
      }),
    );

    server.registerTool(
      "listar_entendimientos",
      {
        title: "Listar entendimientos",
        description: "Lista los expedientes cargados en la app.",
        inputSchema: z.object({}),
      },
      async () => {
        try {
          const items = await listEntendimientos();
          return jsonResult(items);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    );

    server.registerTool(
      "leer_entendimiento",
      {
        title: "Leer entendimiento",
        description: "Devuelve un expediente completo por id.",
        inputSchema: z.object({
          id: z.string().describe("UUID del entendimiento"),
        }),
      },
      async ({ id }) => {
        try {
          const doc = await getEntendimiento(id);
          if (!doc) return errorResult("No encontré ese entendimiento.");
          return jsonResult(doc);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    );

    server.registerTool(
      "crear_entendimiento",
      {
        title: "Crear entendimiento",
        description:
          "Crea un expediente nuevo en la app. Usalo al terminar de armar (o con un borrador completo).",
        inputSchema: z.object({
          empresa: z.string(),
          periodo: z.string().optional(),
          fecha: z.string().optional(),
          vertical: z.string().optional(),
          total: z.number().nullable().optional(),
          semaforo_general: z.enum(["g", "y", "r", "x"]).optional(),
          modo: z.string().optional(),
          diagnostico: z.string().optional(),
          conteo: z
            .object({
              g: z.number().optional(),
              y: z.number().optional(),
              r: z.number().optional(),
              x: z.number().optional(),
            })
            .optional(),
          sponsor: z
            .object({
              nombre: z.string(),
              rol: z.string(),
            })
            .nullable()
            .optional(),
          caso: z
            .object({
              modelo: z.array(z.string()).optional(),
              impacto: z.array(z.string()).optional(),
              founders: z
                .array(
                  z.object({
                    iniciales: z.string(),
                    nombre: z.string(),
                    role: z.string(),
                    bio: z.string(),
                  }),
                )
                .optional(),
              links: z
                .array(z.object({ label: z.string(), url: z.string() }))
                .optional(),
            })
            .optional(),
          sections: z.record(z.string(), sectionSchema).optional(),
          validacion: z
            .object({
              expertos: z.array(z.record(z.string(), z.string())).optional(),
              clientes: z.array(z.record(z.string(), z.string())).optional(),
              inversionistas: z
                .array(z.record(z.string(), z.string()))
                .optional(),
            })
            .optional(),
          apuesta: z
            .object({
              titulo: z.string().optional(),
              parrafos: z.array(z.string()).optional(),
              razones: z.array(z.string()).optional(),
              banderas: z.array(z.string()).optional(),
              condiciones: z.array(z.string()).optional(),
              senales: z.array(z.string()).optional(),
              veredicto: z.string().optional(),
            })
            .optional(),
        }),
      },
      async (input) => {
        try {
          const doc = await createEntendimiento(
            {
              ...input,
              sections: input.sections as never,
              validacion: input.validacion as never,
            },
            currentIdentity(),
          );
          return jsonResult({
            id: doc.id,
            empresa: doc.empresa,
            path: `/e/${doc.id}`,
            message:
              "Expediente creado. Abrí /e/" +
              doc.id +
              " en la app para verlo y copiar el enlace.",
          });
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    );

    server.registerTool(
      "actualizar_seccion",
      {
        title: "Actualizar sección",
        description:
          "Actualiza una de las 9 dimensiones de un expediente existente.",
        inputSchema: z.object({
          id: z.string(),
          seccion: sectionKeySchema,
          patch: sectionSchema,
        }),
      },
      async ({ id, seccion, patch }) => {
        try {
          const doc = await updateSection(id, seccion, {
            ...patch,
            subs: patch.subs?.map((s) => ({
              k: s.k,
              raw: s.raw,
              u: s.u,
              score: s.score ?? null,
              sem: s.sem ?? "x",
              por: s.por,
            })),
          });
          return jsonResult({
            id: doc.id,
            seccion,
            section: doc.sections[seccion],
          });
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    );

    server.registerTool(
      "actualizar_entendimiento",
      {
        title: "Actualizar entendimiento",
        description:
          "Actualiza cabecera, caso, validación o apuesta de un expediente.",
        inputSchema: z.object({
          id: z.string(),
          patch: z.object({
            empresa: z.string().optional(),
            periodo: z.string().optional(),
            fecha: z.string().optional(),
            vertical: z.string().optional(),
            total: z.number().nullable().optional(),
            semaforo_general: z.enum(["g", "y", "r", "x"]).optional(),
            modo: z.string().optional(),
            diagnostico: z.string().optional(),
            sponsor: z
              .object({ nombre: z.string(), rol: z.string() })
              .nullable()
              .optional(),
            caso: z
              .object({
                modelo: z.array(z.string()).optional(),
                impacto: z.array(z.string()).optional(),
                founders: z
                  .array(
                    z.object({
                      iniciales: z.string(),
                      nombre: z.string(),
                      role: z.string(),
                      bio: z.string(),
                    }),
                  )
                  .optional(),
              })
              .optional(),
            apuesta: z
              .object({
                titulo: z.string().optional(),
                parrafos: z.array(z.string()).optional(),
                razones: z.array(z.string()).optional(),
                banderas: z.array(z.string()).optional(),
                condiciones: z.array(z.string()).optional(),
                senales: z.array(z.string()).optional(),
                veredicto: z.string().optional(),
              })
              .optional(),
          }),
        }),
      },
      async ({ id, patch }) => {
        try {
          const doc = await updateEntendimientoFields(id, patch);
          return jsonResult({ id: doc.id, empresa: doc.empresa, updated: true });
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    );

    server.registerTool(
      "importar_html",
      {
        title: "Importar HTML",
        description:
          "Parsea un HTML de plantilla EL vigente (DATA/SECTIONS/CASO/VALIDACION_EXTERNA/apuesta) y crea el expediente. Tira fotos en base64.",
        inputSchema: z.object({
          html: z.string().describe("Contenido completo del HTML"),
        }),
      },
      async ({ html }) => {
        try {
          const doc = await importHtmlAndCreate(html, currentIdentity());
          return jsonResult({
            id: doc.id,
            empresa: doc.empresa,
            total: doc.total,
            path: `/e/${doc.id}`,
            message:
              "Importado. Abrí /e/" +
              doc.id +
              " en la app para verlo y copiar el enlace.",
          });
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    );
  },
  {
    serverInfo: {
      name: "entendimiento-luchante",
      version: "1.0.0",
    },
    instructions: SKILL_INSTRUCTIONS,
  },
);

async function handle(req: Request): Promise<Response> {
  const identity = identityFromRequest(req);
  return identityStore.run(identity, () => handler(req));
}

export { handle as GET, handle as POST };
