// Liveness probe for Nimbus deploys. `.nimbus.yml` points
// `runtime.healthcheckPath` here: a deploy is not marked live until this
// answers 200, so keep it cheap and dependency-free — it must succeed on a
// container that has just booted, before anything else is warm.
//
// If you remove this route, clear `runtime.healthcheckPath` in `.nimbus.yml`
// too, or every deploy will wait for a 200 that never comes.

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ status: "ok", uptime: process.uptime() });
}
