"use client";

import { useState } from "react";

export function ConnectClaudeBox({ mcpUrl }: { mcpUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(mcpUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
        Seguí en Claude
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
        Este documento se arma y se cuestiona desde Claude. Conectá la misma app
        como conector remoto y pedile que use el prompt{" "}
        <code className="rounded bg-black/5 px-1.5 py-0.5 text-[0.85em] dark:bg-white/10">
          revisar-entendimiento
        </code>
        .
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--ink)]">
        <li>En Claude, abrí conectores / MCP remotos.</li>
        <li>Agregá la URL de abajo.</li>
        <li>Pedile que lea este expediente y te ayude a cuestionarlo.</li>
      </ol>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <code className="block flex-1 overflow-x-auto rounded-lg bg-[var(--ink)] px-3 py-2.5 text-xs text-[var(--mint)]">
          {mcpUrl}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--brand)] dark:bg-transparent"
        >
          {copied ? "Copiada" : "Copiar URL"}
        </button>
      </div>
    </aside>
  );
}
