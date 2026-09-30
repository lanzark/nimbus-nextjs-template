import Link from "next/link";
import { notFound } from "next/navigation";
import { ConnectClaudeBox } from "@/components/ConnectClaudeBox";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { DocumentView } from "@/components/DocumentView";
import { getEntendimiento } from "@/lib/entendimiento";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function publicOrigin(h: Headers): string {
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return process.env.NIMBUS_PUBLIC_URL ?? "http://localhost:3000";
}

export default async function EntendimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await getEntendimiento(id);
  if (!doc) notFound();

  const h = await headers();
  const origin = publicOrigin(h);
  const shareUrl = `${origin}/e/${doc.id}`;
  const mcpUrl = `${origin}/api/mcp`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--brand)]"
        >
          ← Todos los entendimientos
        </Link>
        <CopyLinkButton url={shareUrl} />
      </div>

      <ConnectClaudeBox mcpUrl={mcpUrl} />

      <DocumentView doc={doc} />
    </div>
  );
}
