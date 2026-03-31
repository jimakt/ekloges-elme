import Link from "next/link";

import { ComparisonCyclesSettings } from "@/components/comparison-cycles-settings";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-6 md:px-8 md:py-8">
      <section className="grid gap-6 overflow-hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(145deg,rgba(255,251,245,0.96),rgba(247,236,220,0.78))] p-7 shadow-[0_24px_80px_rgba(61,42,23,0.12)] md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
              Ρυθμίσεις
            </div>
            <h1 className="mt-3 text-[clamp(1.35rem,3.2vw,3.4rem)] font-black tracking-[-0.05em] text-red-900">
              Κεντρικές ρυθμίσεις εφαρμογής
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-stone-300 bg-white/80 px-5 text-sm font-semibold text-stone-900 transition hover:border-stone-950 hover:bg-white"
          >
            Επιστροφή στην αρχική
          </Link>
        </div>

        <ComparisonCyclesSettings />
      </section>
    </main>
  );
}
