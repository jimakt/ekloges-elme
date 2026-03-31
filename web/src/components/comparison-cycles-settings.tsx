"use client";

import { useEffect, useState } from "react";

type ElectionType = "Δ.Σ." | "ΟΜΟΣΠΟΝΔΙΑ";

type ComparisonCycleView = {
  electionType: ElectionType;
  currentYear: number;
  previousYear: number;
  comparisonLabel: string;
};

type ComparisonCycleMap = Record<ElectionType, ComparisonCycleView>;

type ComparisonCycleHistoryItem = ComparisonCycleView & {
  id: number;
  isActive: boolean;
  updatedAt: string;
};

type ComparisonCycleHistoryMap = Record<
  ElectionType,
  ComparisonCycleHistoryItem[]
>;

function formatTimestamp(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("el-GR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function parseInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function readJsonPayload<T>(response: Response): Promise<T> {
  const bodyText = await response.text();

  if (!bodyText.trim()) {
    throw new Error("Ο server επέστρεψε κενή απάντηση.");
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new Error("Η απάντηση του server δεν ήταν έγκυρο JSON.");
  }
}

function getComparisonCyclePreviewLabel(
  electionType: ElectionType,
  currentYearValue: string,
) {
  const currentYear = parseInteger(currentYearValue);

  if (currentYear < 1900) {
    return "Συμπλήρωσε έγκυρη χρονιά κύκλου.";
  }

  if (electionType === "Δ.Σ.") {
    return `1ετείς με ${currentYear - 1} • 2ετείς με ${currentYear - 2}`;
  }

  return `με ${currentYear - 2}`;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  invalid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-12 rounded-2xl border px-4 text-sm outline-none transition ${
        invalid
          ? "border-rose-400 bg-rose-50 text-rose-950 focus:border-rose-600 focus:ring-4 focus:ring-rose-600/10"
          : "border-stone-300 bg-white text-stone-900 focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
      }`}
    />
  );
}

function ComparisonCycleCard({
  electionType,
  currentYear,
  onCurrentYearChange,
  onSave,
  onRestore,
  isSaving,
  activeCycle,
  history,
}: {
  electionType: ElectionType;
  currentYear: string;
  onCurrentYearChange: (value: string) => void;
  onSave: () => void;
  onRestore: (currentYear: number) => void;
  isSaving: boolean;
  activeCycle: ComparisonCycleView | null;
  history: ComparisonCycleHistoryItem[];
}) {
  const previewLabel = getComparisonCyclePreviewLabel(electionType, currentYear);
  const isValidYear = parseInteger(currentYear) >= 1900;

  return (
    <article className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-6 shadow-[0_16px_40px_rgba(60,44,28,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
            Κύκλος σύγκρισης
          </div>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            {electionType}
          </h3>
        </div>
        {activeCycle ? (
          <div className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700">
            Ενεργός {activeCycle.currentYear}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4">
        <Field label="Τρέχουσα χρονιά κύκλου">
          <TextInput
            value={currentYear}
            invalid={currentYear.trim().length > 0 && !isValidYear}
            onChange={onCurrentYearChange}
          />
        </Field>

        <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Σύγκριση:</span> {previewLabel}
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !isValidYear}
          className="h-12 rounded-full bg-stone-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isSaving ? "Αποθήκευση..." : "Αποθήκευση κύκλου"}
        </button>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
          Ιστορικό κύκλων
        </div>
        {history.length ? (
          history.map((cycle) => (
            <div
              key={cycle.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-stone-200 bg-stone-50 px-4 py-3"
            >
              <div className="grid gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900">
                    {cycle.currentYear}
                  </span>
                  {cycle.isActive ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Ενεργός
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-stone-600">
                  Σύγκριση {cycle.comparisonLabel}
                </div>
                <div className="text-xs text-stone-500">
                  Τελευταία αλλαγή {formatTimestamp(cycle.updatedAt)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRestore(cycle.currentYear)}
                disabled={isSaving || cycle.isActive}
                className="h-10 rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
              >
                {cycle.isActive ? "Ενεργός κύκλος" : "Επαναφορά"}
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-600">
            Δεν υπάρχουν παλιότεροι αποθηκευμένοι κύκλοι για αυτόν τον τύπο.
          </div>
        )}
      </div>
    </article>
  );
}

export function ComparisonCyclesSettings() {
  const [comparisonCycles, setComparisonCycles] = useState<ComparisonCycleMap | null>(
    null,
  );
  const [comparisonHistory, setComparisonHistory] =
    useState<ComparisonCycleHistoryMap>({
      "Δ.Σ.": [],
      ΟΜΟΣΠΟΝΔΙΑ: [],
    });
  const [comparisonCycleDrafts, setComparisonCycleDrafts] = useState<
    Record<ElectionType, string>
  >({
    "Δ.Σ.": "",
    ΟΜΟΣΠΟΝΔΙΑ: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [savingType, setSavingType] = useState<ElectionType | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadComparisonCycles() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/comparison-cycles", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await readJsonPayload<{
          cycles?: ComparisonCycleMap;
          history?: ComparisonCycleHistoryMap;
          error?: string;
        }>(response);

        if (!response.ok || !payload.cycles || !payload.history) {
          throw new Error(
            payload.error ?? "Απέτυχε η φόρτωση των κύκλων σύγκρισης.",
          );
        }

        setComparisonCycles(payload.cycles);
        setComparisonHistory(payload.history);
        setComparisonCycleDrafts({
          "Δ.Σ.": payload.cycles["Δ.Σ."].currentYear.toString(),
          ΟΜΟΣΠΟΝΔΙΑ: payload.cycles.ΟΜΟΣΠΟΝΔΙΑ.currentYear.toString(),
        });
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setComparisonCycles(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Απέτυχε η φόρτωση των κύκλων σύγκρισης.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadComparisonCycles();

    return () => controller.abort();
  }, []);

  const handleSaveComparisonCycle = async (
    electionType: ElectionType,
    yearOverride?: number,
  ) => {
    setSavingType(electionType);
    setMessage("");
    setError("");

    try {
      const currentYear =
        typeof yearOverride === "number"
          ? yearOverride
          : parseInteger(comparisonCycleDrafts[electionType]);

      if (currentYear < 1900) {
        throw new Error("Συμπλήρωσε έγκυρη χρονιά κύκλου.");
      }

      const response = await fetch("/api/comparison-cycles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          electionType,
          currentYear,
        }),
      });

      const payload = await readJsonPayload<{
        cycles?: ComparisonCycleMap;
        history?: ComparisonCycleHistoryMap;
        message?: string;
        error?: string;
      }>(response);

      if (!response.ok || !payload.cycles || !payload.history) {
        throw new Error(
          payload.error ?? "Απέτυχε η αποθήκευση του κύκλου σύγκρισης.",
        );
      }

      setComparisonCycles(payload.cycles);
      setComparisonHistory(payload.history);
      setComparisonCycleDrafts({
        "Δ.Σ.": payload.cycles["Δ.Σ."].currentYear.toString(),
        ΟΜΟΣΠΟΝΔΙΑ: payload.cycles.ΟΜΟΣΠΟΝΔΙΑ.currentYear.toString(),
      });
      setMessage(payload.message ?? "Ο κύκλος σύγκρισης αποθηκεύτηκε.");
    } catch (saveError) {
      setMessage("");
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Απέτυχε η αποθήκευση του κύκλου σύγκρισης.",
      );
    } finally {
      setSavingType(null);
    }
  };

  return (
    <section className="grid gap-6">
      <article className="rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(180deg,#174e57,#112f35)] p-7 text-stone-50 shadow-[0_16px_50px_rgba(16,48,53,0.18)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-teal-100/70">
              Ρυθμίσεις
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
              Κύκλοι σύγκρισης
            </h2>
            <p className="mt-4 text-sm leading-7 text-teal-50/90">
              Οι κύκλοι αλλάζουν ξεχωριστά για `Δ.Σ.` και `ΟΜΟΣΠΟΝΔΙΑ` και
              επηρεάζουν άμεσα τα συγκεντρωτικά της παρουσίασης.
            </p>
          </div>
          {isLoading ? (
            <div className="rounded-full border border-teal-200/40 bg-teal-50/10 px-4 py-2 text-sm font-medium text-teal-50">
              Φόρτωση κύκλων...
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-5 rounded-3xl border border-rose-200/60 bg-rose-50/90 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-5 rounded-3xl border border-emerald-200/60 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ComparisonCycleCard
            electionType="Δ.Σ."
            currentYear={comparisonCycleDrafts["Δ.Σ."]}
            onCurrentYearChange={(value) =>
              setComparisonCycleDrafts((current) => ({
                ...current,
                "Δ.Σ.": value,
              }))
            }
            onSave={() => void handleSaveComparisonCycle("Δ.Σ.")}
            onRestore={(currentYear) => {
              setComparisonCycleDrafts((current) => ({
                ...current,
                "Δ.Σ.": currentYear.toString(),
              }));
              void handleSaveComparisonCycle("Δ.Σ.", currentYear);
            }}
            isSaving={savingType === "Δ.Σ."}
            activeCycle={comparisonCycles?.["Δ.Σ."] ?? null}
            history={comparisonHistory["Δ.Σ."]}
          />
          <ComparisonCycleCard
            electionType="ΟΜΟΣΠΟΝΔΙΑ"
            currentYear={comparisonCycleDrafts.ΟΜΟΣΠΟΝΔΙΑ}
            onCurrentYearChange={(value) =>
              setComparisonCycleDrafts((current) => ({
                ...current,
                ΟΜΟΣΠΟΝΔΙΑ: value,
              }))
            }
            onSave={() => void handleSaveComparisonCycle("ΟΜΟΣΠΟΝΔΙΑ")}
            onRestore={(currentYear) => {
              setComparisonCycleDrafts((current) => ({
                ...current,
                ΟΜΟΣΠΟΝΔΙΑ: currentYear.toString(),
              }));
              void handleSaveComparisonCycle("ΟΜΟΣΠΟΝΔΙΑ", currentYear);
            }}
            isSaving={savingType === "ΟΜΟΣΠΟΝΔΙΑ"}
            activeCycle={comparisonCycles?.ΟΜΟΣΠΟΝΔΙΑ ?? null}
            history={comparisonHistory.ΟΜΟΣΠΟΝΔΙΑ}
          />
        </div>
      </article>

      <article className="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50 p-7">
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
          Μελλοντικά
        </div>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
          Χρήστες και δικαιώματα
        </h3>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          Η σελίδα ρυθμίσεων είναι πλέον έτοιμη να φιλοξενήσει αργότερα users,
          ρόλους και δικαιώματα πρόσβασης.
        </p>
      </article>
    </section>
  );
}
