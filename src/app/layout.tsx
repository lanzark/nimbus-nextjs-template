import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Entendimiento Luchante",
  description:
    "Expedientes de entendimiento para el equipo de Lucha. Se arman en Claude y se comparten acá.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-[var(--line)]/70 bg-[var(--surface)]/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link href="/" className="group flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-white">
                EL
              </span>
              <span>
                <span className="block font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-[var(--ink)] group-hover:text-[var(--brand)]">
                  Entendimiento Luchante
                </span>
                <span className="block text-xs text-[var(--muted)]">Lucha</span>
              </span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
