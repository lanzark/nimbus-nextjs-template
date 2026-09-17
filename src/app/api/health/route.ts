// Liveness probe. Keep it cheap and dependency-free — it has to answer on a
// container that has only just booted, before anything else is warm.

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ status: "ok", uptime: process.uptime() });
}
