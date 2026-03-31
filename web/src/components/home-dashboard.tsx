"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  baseSlateOptions,
  regionOptions,
  type RegionOption,
} from "@/lib/collection-form-data";
import {
  GREECE_MAP_HEIGHT,
  GREECE_MAP_WIDTH,
  greeceMapShapes,
} from "@/lib/greece-map-data";

type ElectionType = "Δ.Σ." | "ΟΜΟΣΠΟΝΔΙΑ";
type Mode = "entry" | "edit" | "presentation";
type KentrikiMakedoniaView = "all" | "thessaloniki" | "rest";

type ElectionResultView = {
  canonicalName: string;
  votes: number;
  seats: number;
  percentage: number;
  isCore: boolean;
};

type ElectionView = {
  id: number;
  electionYear: number;
  electionType: ElectionType;
  termYears: 1 | 2;
  electionDate: string | null;
  registeredVoters: number;
  voted: number;
  invalidBlank: number;
  valid: number;
  candidatesTotal: number;
  substitutesTotal: number;
  newlyAppointedTotal: number;
  notes: string;
  results: ElectionResultView[];
};

type EntryDefaults = {
  regionName: string;
  elmeName: string;
  electionType: ElectionType;
  electionYear: number | null;
  termYears: 1 | 2;
  electionDate: string | null;
};

type ElectionRevisionView = {
  id: number;
  electionYear: number;
  changedAt: string;
  changeNote: string;
};

type ComparisonCycleView = {
  electionType: ElectionType;
  currentYear: number;
  previousYear: number;
  comparisonLabel: string;
};

type AggregateCoverageView = {
  totalElmeCount: number;
  currentCount: number;
  previousCount: number;
};

type ElectionContext = {
  entryDefaults: EntryDefaults;
  editing: {
    availableYears: number[];
    selectedElection: ElectionView | null;
    revisions: ElectionRevisionView[];
  };
  presentation: {
    latest: ElectionView | null;
    previous: ElectionView | null;
  };
  aggregates: {
    region: AggregateScopeView;
    national: AggregateScopeView;
  };
};

type AggregateElectionView = {
  yearLabel: string;
  electionType: ElectionType;
  sourceCount: number;
  voted: number;
  invalidBlank: number;
  valid: number;
  candidatesTotal: number;
  substitutesTotal: number;
  newlyAppointedTotal: number;
  results: ElectionResultView[];
};

type AggregateScopeView = {
  scopeLabel: string;
  comparisonCycle: ComparisonCycleView | null;
  coverage: AggregateCoverageView;
  latest: AggregateElectionView | null;
  previous: AggregateElectionView | null;
};

type ResultInputRow = {
  canonicalName: string;
  votes: string;
  seats: string;
};

type EntryFormState = {
  electionYear: string;
  termYears: "1" | "2";
  electionDate: string;
  voted: string;
  invalidBlank: string;
  valid: string;
  candidatesTotal: string;
  substitutesTotal: string;
  newlyAppointedTotal: string;
  notes: string;
  coreRows: ResultInputRow[];
  extraRows: ResultInputRow[];
};

type FormValidationState = {
  sumVotes: number;
  totalsMatchValid: boolean;
  turnoutMatchesTotals: boolean;
  unnamedExtraRows: number[];
  errors: string[];
};

const regionLookup = new Map(regionOptions.map((region) => [region.id, region]));

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

function getVisibleElmes(
  region: RegionOption,
  subgroupView: KentrikiMakedoniaView,
) {
  if (region.id !== "kentriki-makedonia") {
    return region.elmes;
  }

  if (subgroupView === "thessaloniki") {
    return region.elmes.filter((entry) => entry.isThessalonikiSubgroup);
  }

  if (subgroupView === "rest") {
    return region.elmes.filter((entry) => !entry.isThessalonikiSubgroup);
  }

  return region.elmes;
}

function buildInitialFormState(defaults: EntryDefaults): EntryFormState {
  return {
    electionYear: defaults.electionYear?.toString() ?? "",
    termYears: defaults.termYears === 2 ? "2" : "1",
    electionDate: defaults.electionDate ?? "",
    voted: "",
    invalidBlank: "",
    valid: "",
    candidatesTotal: "",
    substitutesTotal: "",
    newlyAppointedTotal: "",
    notes: "",
    coreRows: baseSlateOptions.map((slate) => ({
      canonicalName: slate,
      votes: "",
      seats: "",
    })),
    extraRows: [
      {
        canonicalName: "",
        votes: "",
        seats: "",
      },
    ],
  };
}

function isCoreSlate(canonicalName: string) {
  return baseSlateOptions.some((option) => option === canonicalName);
}

function buildFormStateFromElection(election: ElectionView): EntryFormState {
  const resultsByName = new Map(
    election.results.map((result) => [result.canonicalName.trim(), result] as const),
  );
  const extraRows = election.results
    .filter((result) => !isCoreSlate(result.canonicalName.trim()))
    .map((result) => ({
      canonicalName: result.canonicalName,
      votes: result.votes.toString(),
      seats: result.seats.toString(),
    }));

  return {
    electionYear: election.electionYear.toString(),
    termYears: election.termYears === 2 ? "2" : "1",
    electionDate: election.electionDate ?? "",
    voted: election.voted.toString(),
    invalidBlank: election.invalidBlank.toString(),
    valid: election.valid.toString(),
    candidatesTotal: election.candidatesTotal.toString(),
    substitutesTotal: election.substitutesTotal.toString(),
    newlyAppointedTotal: election.newlyAppointedTotal.toString(),
    notes: election.notes,
    coreRows: baseSlateOptions.map((slate) => {
      const existing = resultsByName.get(slate);

      return {
        canonicalName: slate,
        votes: existing?.votes?.toString() ?? "",
        seats: existing?.seats?.toString() ?? "",
      };
    }),
    extraRows:
      extraRows.length > 0
        ? [...extraRows, { canonicalName: "", votes: "", seats: "" }]
        : [{ canonicalName: "", votes: "", seats: "" }],
  };
}

function buildFormValidation(formState: EntryFormState): FormValidationState {
  const voted = parseInteger(formState.voted);
  const invalidBlank = parseInteger(formState.invalidBlank);
  const valid = parseInteger(formState.valid);
  const extraRowsWithNumbersAndNoName = formState.extraRows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => {
      const hasNumbers = parseInteger(row.votes) > 0 || parseInteger(row.seats) > 0;
      return hasNumbers && !row.canonicalName.trim();
    })
    .map(({ index }) => index);
  const sumVotes = [...formState.coreRows, ...formState.extraRows]
    .filter((row) => row.canonicalName.trim())
    .reduce((sum, row) => sum + parseInteger(row.votes), 0);
  const totalsMatchValid = sumVotes === valid;
  const turnoutMatchesTotals = valid + invalidBlank === voted;
  const errors: string[] = [];

  if (!totalsMatchValid) {
    errors.push(
      `Το άθροισμα των ψήφων των παρατάξεων (${sumVotes}) πρέπει να είναι ίσο με τα έγκυρα (${valid}).`,
    );
  }

  if (!turnoutMatchesTotals) {
    errors.push(
      `Τα έγκυρα (${valid}) μαζί με τα άκυρα-λευκά (${invalidBlank}) πρέπει να είναι ίσα με το ψήφισαν (${voted}).`,
    );
  }

  if (extraRowsWithNumbersAndNoName.length) {
    errors.push("Υπάρχει πρόσθετη παράταξη με ψήφους ή έδρες αλλά χωρίς όνομα.");
  }

  return {
    sumVotes,
    totalsMatchValid,
    turnoutMatchesTotals,
    unnamedExtraRows: extraRowsWithNumbersAndNoName,
    errors,
  };
}

function parseInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatPercentage(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatElectionYear(value: number | null | undefined) {
  return typeof value === "number" ? value.toString() : "—";
}

function formatTermYears(value: 1 | 2 | null | undefined) {
  if (value === 2) {
    return "2ετής";
  }

  if (value === 1) {
    return "1ετής";
  }

  return "—";
}

function TermYearsBadge({ value }: { value: 1 | 2 | null | undefined }) {
  if (value == null) {
    return null;
  }

  const isTwoYear = value === 2;

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] shadow-sm",
        isTwoYear
          ? "border-rose-300 bg-rose-50 text-rose-900"
          : "border-stone-300 bg-stone-50 text-stone-700",
      ].join(" ")}
    >
      <span
        className={[
          "h-2.5 w-2.5 rounded-full",
          isTwoYear ? "bg-rose-500" : "bg-stone-500",
        ].join(" ")}
      />
      {formatTermYears(value)}
    </div>
  );
}

function formatRevisionTimestamp(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("el-GR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getTrendMeta(delta: number) {
  if (delta > 0) {
    return {
      arrow: "↑",
      className: "text-emerald-700",
    };
  }

  if (delta < 0) {
    return {
      arrow: "↓",
      className: "text-rose-700",
    };
  }

  return {
    arrow: "-",
    className: "text-stone-500",
  };
}

function formatSignedInteger(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return value.toString();
}

function formatSignedPercentagePoints(value: number) {
  const points = (value * 100).toFixed(2);

  if (value > 0) {
    return `+${points}%`;
  }

  return `${points}%`;
}

function DeltaInline({
  delta,
  kind = "number",
}: {
  delta: number;
  kind?: "number" | "percentage";
}) {
  const trend = getTrendMeta(delta);
  const formatted =
    kind === "percentage"
      ? formatSignedPercentagePoints(delta)
      : formatSignedInteger(delta);

  return (
    <span className={`whitespace-nowrap text-xs font-semibold ${trend.className}`}>
      {" "}
      ({formatted}) {trend.arrow}
    </span>
  );
}

function DeltaInlineCell({
  delta,
  kind = "number",
}: {
  delta?: number;
  kind?: "number" | "percentage";
}) {
  if (typeof delta !== "number") {
    return <span className="min-w-[6.5rem]" aria-hidden="true" />;
  }

  const trend = getTrendMeta(delta);
  const formatted =
    kind === "percentage"
      ? formatSignedPercentagePoints(delta)
      : formatSignedInteger(delta);

  return (
    <span
      className={`min-w-[6.5rem] whitespace-nowrap text-right text-xs font-semibold ${trend.className}`}
    >
      ({formatted}) {trend.arrow}
    </span>
  );
}

function normalizeSlateName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .trim();
}

function hasSlateToken(normalized: string, token: string) {
  return (
    normalized === token ||
    normalized.startsWith(`${token} `) ||
    normalized.startsWith(`${token}-`) ||
    normalized.startsWith(`${token}(`) ||
    normalized.endsWith(` ${token}`) ||
    normalized.endsWith(`-${token}`) ||
    normalized.includes(` ${token} `) ||
    normalized.includes(` ${token}-`) ||
    normalized.includes(`-${token} `) ||
    normalized.includes(`(${token})`) ||
    normalized.includes(`(${token} `) ||
    normalized.includes(` ${token})`)
  );
}

function getSlateStyle(canonicalName: string) {
  const normalized = normalizeSlateName(canonicalName);

  if (normalized.includes("ΠΑΡΕΜΒ") || normalized.includes("ΑΝΤΑΡΣ")) {
    return {
      rowClass: "group hover:bg-amber-100",
      textClass: "text-stone-900 group-hover:text-amber-950",
      stripeClass: "bg-amber-500",
    };
  }

  if (hasSlateToken(normalized, "ΑΣΕ")) {
    return {
      rowClass: "bg-rose-50 hover:bg-rose-100",
      textClass: "text-rose-900",
      stripeClass: "bg-rose-700",
    };
  }

  if (normalized.includes("ΔΑΚΕ")) {
    return {
      rowClass: "group hover:bg-blue-50",
      textClass: "text-stone-900 group-hover:text-blue-900",
      stripeClass: "bg-blue-700",
    };
  }

  if (normalized.includes("ΠΕΚ")) {
    return {
      rowClass: "group hover:bg-emerald-50",
      textClass: "text-stone-900 group-hover:text-emerald-900",
      stripeClass: "bg-emerald-700",
    };
  }

  if (normalized.includes("ΣΥΝΕΚ")) {
    return {
      rowClass: "group hover:bg-violet-50",
      textClass: "text-stone-900 group-hover:text-violet-900",
      stripeClass: "bg-violet-700",
    };
  }

  if (normalized.includes("ΜΕΤΑ")) {
    return {
      rowClass: "group hover:bg-yellow-50",
      textClass: "text-stone-900 group-hover:text-yellow-900",
      stripeClass: "bg-yellow-700",
    };
  }

  if (normalized.includes("ΚΙΝΗΣ")) {
    return {
      rowClass: "group hover:bg-amber-50",
      textClass: "text-stone-900 group-hover:text-amber-900",
      stripeClass: "bg-amber-600",
    };
  }

  if (normalized.includes("ΜΛ")) {
    return {
      rowClass: "group hover:bg-orange-100",
      textClass: "text-stone-900 group-hover:text-orange-950",
      stripeClass: "bg-orange-800",
    };
  }

  if (normalized.includes("ΜΑΖΙ")) {
    return {
      rowClass: "group hover:bg-cyan-50",
      textClass: "text-stone-900 group-hover:text-cyan-900",
      stripeClass: "bg-cyan-700",
    };
  }

  if (normalized.includes("ΔΙΑΦΟΡ")) {
    return {
      rowClass: "group hover:bg-slate-100",
      textClass: "text-stone-900 group-hover:text-slate-900",
      stripeClass: "bg-slate-600",
    };
  }

  return {
    rowClass: "group hover:bg-stone-100",
    textClass: "text-stone-900 group-hover:text-stone-900",
    stripeClass: "bg-stone-500",
  };
}

function buildPresentationRowOrder(context: ElectionContext | null) {
  const orderedNames: string[] = [...baseSlateOptions];
  const seen = new Set(orderedNames.map((name) => name.trim()));

  const buckets = [
    context?.presentation.latest?.results ?? [],
    context?.presentation.previous?.results ?? [],
    context?.aggregates.region.latest?.results ?? [],
    context?.aggregates.region.previous?.results ?? [],
    context?.aggregates.national.latest?.results ?? [],
    context?.aggregates.national.previous?.results ?? [],
  ];

  for (const bucket of buckets) {
    for (const result of bucket) {
      const name = result.canonicalName.trim();

      if (!name || seen.has(name)) {
        continue;
      }

      orderedNames.push(name);
      seen.add(name);
    }
  }

  return orderedNames;
}

function normalizeResultsForPresentation(
  results: ElectionResultView[],
  rowOrder: string[],
) {
  const byName = new Map(
    results.map((result) => [result.canonicalName.trim(), result] as const),
  );

  return rowOrder.map((canonicalName) => {
    const existing = byName.get(canonicalName);

    if (existing) {
      return existing;
    }

    return {
      canonicalName,
      votes: 0,
      seats: 0,
      percentage: 0,
      isCore: baseSlateOptions.some((option) => option === canonicalName),
    };
  });
}

type ComparisonRow = {
  canonicalName: string;
  latest: ElectionResultView;
  previous: ElectionResultView;
};

function buildComparisonRows(
  latestResults: ElectionResultView[],
  previousResults: ElectionResultView[],
  rowOrder: string[],
) {
  const latestNormalized = normalizeResultsForPresentation(latestResults, rowOrder);
  const previousMap = new Map(
    normalizeResultsForPresentation(previousResults, rowOrder).map((result) => [
      result.canonicalName,
      result,
    ]),
  );
  const hasLatestResults = latestResults.some(
    (result) => result.votes > 0 || result.seats > 0,
  );

  return latestNormalized
    .filter((result) => {
      const previous = previousMap.get(result.canonicalName);

      return (
        result.votes > 0 ||
        result.seats > 0 ||
        (previous?.votes ?? 0) > 0 ||
        (previous?.seats ?? 0) > 0
      );
    })
    .map((result) => ({
      canonicalName: result.canonicalName,
      latest: result,
      previous: previousMap.get(result.canonicalName) ?? {
        canonicalName: result.canonicalName,
        votes: 0,
        seats: 0,
        percentage: 0,
        isCore: result.isCore,
      },
    }))
    .sort((left, right) => {
      const leftCurrent = hasLatestResults ? left.latest : left.previous;
      const rightCurrent = hasLatestResults ? right.latest : right.previous;

      if (leftCurrent.votes !== rightCurrent.votes) {
        return rightCurrent.votes - leftCurrent.votes;
      }

      if (leftCurrent.seats !== rightCurrent.seats) {
        return rightCurrent.seats - leftCurrent.seats;
      }

      if (left.previous.votes !== right.previous.votes) {
        return right.previous.votes - left.previous.votes;
      }

      return left.canonicalName.localeCompare(right.canonicalName, "el");
    });
}

type ComparisonSummaryRow = {
  label: string;
  latestValue: string | number;
  previousValue: string | number;
  latestDelta?: number;
  deltaKind?: "number" | "percentage";
};

function ComparisonSummaryTable({
  rows,
  latestLabel,
  previousLabel,
}: {
  rows: ComparisonSummaryRow[];
  latestLabel: string;
  previousLabel: string;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-stone-200">
      <div className="grid grid-cols-[1.25fr_1fr_1fr] gap-3 border-b border-stone-200 bg-stone-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        <div>Στοιχείο</div>
        <div className="text-right">{latestLabel}</div>
        <div className="text-right">{previousLabel}</div>
      </div>
      <div className="grid">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1.25fr_1fr_1fr] gap-3 border-b border-stone-200 px-4 py-3 text-sm last:border-b-0"
          >
            <div className="font-medium text-stone-800">{row.label}</div>
            <div className="text-right font-semibold text-stone-900">
              {row.latestValue}
              {typeof row.latestDelta === "number" ? (
                <DeltaInline delta={row.latestDelta} kind={row.deltaKind} />
              ) : null}
            </div>
            <div className="text-right font-semibold text-stone-700">
              {row.previousValue}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonInfoStrip({
  rows,
  latestLabel,
  previousLabel,
}: {
  rows: ComparisonSummaryRow[];
  latestLabel: string;
  previousLabel: string;
}) {
  if (!rows.length) {
    return null;
  }

  return (
    <div className="mt-5 grid gap-3 md:grid-cols-3">
      {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-[1.4rem] border border-stone-200 bg-stone-50 px-4 py-4"
          >
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            {row.label}
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
              <span className="text-stone-500">{latestLabel}</span>
              <span className="min-w-[3rem] text-right font-semibold text-stone-900">
                {row.latestValue}
              </span>
              <DeltaInlineCell delta={row.latestDelta} kind={row.deltaKind} />
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
              <span className="text-stone-500">{previousLabel}</span>
              <span className="min-w-[3rem] text-right font-semibold text-stone-700">
                {row.previousValue}
              </span>
              <span className="min-w-[6.5rem]" aria-hidden="true" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ComparisonRowsTable({
  rows,
  latestLabel,
  previousLabel,
}: {
  rows: ComparisonRow[];
  latestLabel: string;
  previousLabel: string;
}) {
  if (!rows.length) {
    return (
      <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-600">
        Δεν υπάρχουν παρατάξεις με μη μηδενικά αποτελέσματα σε αυτή τη σύγκριση.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-stone-200">
      <div className="grid grid-cols-[1.7fr_0.75fr_0.75fr_0.8fr_0.75fr_0.75fr_0.8fr] gap-3 border-b border-stone-200 bg-stone-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        <div>Παράταξη</div>
        <div>{latestLabel} ψήφοι</div>
        <div>{latestLabel} έδρες</div>
        <div>{latestLabel} %</div>
        <div>{previousLabel} ψήφοι</div>
        <div>{previousLabel} έδρες</div>
        <div>{previousLabel} %</div>
      </div>
      <div className="grid">
        {rows.map((row) => {
          const style = getSlateStyle(row.canonicalName);

          return (
            <div
              key={row.canonicalName}
              className={`grid grid-cols-[1.7fr_0.75fr_0.75fr_0.8fr_0.75fr_0.75fr_0.8fr] gap-3 border-b border-stone-200 px-4 py-3 text-sm transition-colors last:border-b-0 ${style.rowClass}`}
            >
              <div className={`flex items-center gap-3 font-medium ${style.textClass}`}>
                <span className={`h-6 w-1 rounded-full ${style.stripeClass}`} />
                <span>{row.canonicalName}</span>
              </div>
              <div className={style.textClass}>
                {row.latest.votes}
                <DeltaInline delta={row.latest.votes - row.previous.votes} />
              </div>
              <div className={style.textClass}>
                {row.latest.seats}
                <DeltaInline delta={row.latest.seats - row.previous.seats} />
              </div>
              <div className={style.textClass}>
                {formatPercentage(row.latest.percentage)}
                <DeltaInline
                  delta={row.latest.percentage - row.previous.percentage}
                  kind="percentage"
                />
              </div>
              <div className={style.textClass}>{row.previous.votes}</div>
              <div className={style.textClass}>{row.previous.seats}</div>
              <div className={style.textClass}>{formatPercentage(row.previous.percentage)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
  type = "text",
  readOnly = false,
  placeholder,
  invalid = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  readOnly?: boolean;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(event) => onChange?.(event.target.value)}
      className={`h-12 rounded-2xl border px-4 text-sm outline-none transition ${
        readOnly
          ? "border-stone-200 bg-stone-50 text-stone-600"
          : invalid
            ? "border-rose-400 bg-rose-50 text-rose-950 focus:border-rose-600 focus:ring-4 focus:ring-rose-600/10"
            : "border-stone-300 bg-white text-stone-900 focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
      }`}
    />
  );
}

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 rounded-2xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function SectionTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
        {eyebrow}
      </div>
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-stone-950">
        {title}
      </h2>
      <p className="max-w-3xl text-sm leading-7 text-stone-600">{text}</p>
    </div>
  );
}

function ModeCard({
  mode,
  selected,
  title,
  onSelect,
}: {
  mode: Mode;
  selected: boolean;
  title: string;
  onSelect: (mode: Mode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      className={`grid gap-3 rounded-[1.6rem] border p-5 text-left transition ${
        selected
          ? "border-stone-950 bg-stone-950 text-white shadow-[0_18px_50px_rgba(23,23,23,0.18)]"
          : "border-stone-300 bg-white/75 text-stone-900 hover:border-stone-950"
      }`}
    >
      <div className="text-xs font-medium uppercase tracking-[0.24em] opacity-70">
        {mode === "entry"
          ? "Επιλογή 1"
          : mode === "edit"
            ? "Επιλογή 2"
            : "Επιλογή 3"}
      </div>
      <div className="text-2xl font-semibold tracking-[-0.03em]">{title}</div>
    </button>
  );
}

function GreeceMap({
  selectedRegionId,
  onSelectRegion,
}: {
  selectedRegionId: string;
  onSelectRegion: (regionId: string) => void;
}) {
  const selectedRegion = regionOptions.find((region) => region.id === selectedRegionId);
  const orderedRegions = [
    ...regionOptions.filter((region) => region.id !== selectedRegionId),
    ...(selectedRegion ? [selectedRegion] : []),
  ];

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-stone-300/80 bg-[linear-gradient(180deg,#edf7f8,#d9eaef)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <svg viewBox={`0 0 ${GREECE_MAP_WIDTH} ${GREECE_MAP_HEIGHT}`} className="h-auto w-full">
        <defs>
          <linearGradient id="seaGradient" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#eff8fb" />
            <stop offset="100%" stopColor="#d6e7eb" />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width={GREECE_MAP_WIDTH}
          height={GREECE_MAP_HEIGHT}
          rx="34"
          fill="url(#seaGradient)"
        />

        {orderedRegions.map((region) => {
          const selected = selectedRegionId === region.id;
          const shape = greeceMapShapes[region.id];
          if (!shape) {
            return null;
          }

          const labelAlign =
            shape.labelAlign ??
            (shape.labelX >= shape.anchorX ? "start" : "end");
          const labelTextX =
            labelAlign === "start" ? shape.labelX + 12 : shape.labelX - 12;
          const labelLines =
            shape.labelLines && shape.labelLines.length > 0
              ? shape.labelLines
              : [region.name];
          const calloutStroke = selected ? "#111111" : "#44403c";
          const usesStraightConnector = shape.connectorStyle === "straight";
          const elbowX = shape.anchorX;
          const elbowY = shape.labelY;

          return (
            <g
              key={region.id}
              className="cursor-pointer"
              onClick={() => onSelectRegion(region.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectRegion(region.id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <title>{region.name}</title>
              {shape.paths.map((path, index) => (
                <path
                  key={`${region.id}-${index}`}
                  d={path}
                  fillRule="evenodd"
                  fill={selected ? "#111111" : "#f8f5ef"}
                  stroke={selected ? "#f5f5f4" : "#6c6357"}
                  strokeWidth={selected ? 3.8 : 2.2}
                  className="transition-all duration-150"
                />
              ))}
              <circle
                cx={shape.anchorX}
                cy={shape.anchorY}
                r={selected ? 7 : 6}
                fill={calloutStroke}
                className="pointer-events-none transition-all duration-150"
              />
              {usesStraightConnector ? (
                <line
                  x1={shape.anchorX}
                  y1={shape.anchorY}
                  x2={shape.labelX}
                  y2={shape.labelY}
                  stroke={calloutStroke}
                  strokeWidth={selected ? 3 : 2.2}
                  className="pointer-events-none transition-all duration-150"
                />
              ) : (
                <>
                  <line
                    x1={shape.anchorX}
                    y1={shape.anchorY}
                    x2={elbowX}
                    y2={elbowY}
                    stroke={calloutStroke}
                    strokeWidth={selected ? 3 : 2.2}
                    className="pointer-events-none transition-all duration-150"
                  />
                  <line
                    x1={elbowX}
                    y1={elbowY}
                    x2={shape.labelX}
                    y2={shape.labelY}
                    stroke={calloutStroke}
                    strokeWidth={selected ? 3 : 2.2}
                    className="pointer-events-none transition-all duration-150"
                  />
                </>
              )}
              <text
                x={labelTextX}
                y={shape.labelY}
                textAnchor={labelAlign}
                className="pointer-events-none fill-stone-900 text-[16px] font-semibold tracking-[-0.01em]"
                style={{
                  paintOrder: "stroke",
                  stroke: "rgba(255,255,255,0.96)",
                  strokeWidth: 5,
                }}
              >
                {labelLines.map((line, index) => (
                  <tspan
                    key={`${region.id}-label-${index}`}
                    x={labelTextX}
                    dy={index === 0 ? 0 : 18}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PresentationComparisonCard({
  title,
  latest,
  previous,
  rowOrder,
}: {
  title: string;
  latest: ElectionView | null;
  previous: ElectionView | null;
  rowOrder: string[];
}) {
  if (!latest && !previous) {
    return (
      <article className="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50 p-6">
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
          {title}
        </div>
        <div className="mt-3 text-sm leading-7 text-stone-600">
          Δεν υπάρχει αποθηκευμένη αναμέτρηση σε αυτή τη θέση.
        </div>
      </article>
    );
  }

  const primary = latest ?? previous;
  const latestLabel = formatElectionYear(latest?.electionYear);
  const previousLabel = formatElectionYear(previous?.electionYear);
  const rows = buildComparisonRows(latest?.results ?? [], previous?.results ?? [], rowOrder);
  const metadataRows: ComparisonSummaryRow[] = [
    {
      label: "Υποψήφιοι",
      latestValue: latest?.candidatesTotal ?? "—",
      previousValue: previous?.candidatesTotal ?? "—",
      latestDelta: (latest?.candidatesTotal ?? 0) - (previous?.candidatesTotal ?? 0),
    },
    {
      label: "Αναπληρωτές",
      latestValue: latest?.substitutesTotal ?? "—",
      previousValue: previous?.substitutesTotal ?? "—",
      latestDelta:
        (latest?.substitutesTotal ?? 0) - (previous?.substitutesTotal ?? 0),
    },
    {
      label: "Νεοδιόριστοι",
      latestValue: latest?.newlyAppointedTotal ?? "—",
      previousValue: previous?.newlyAppointedTotal ?? "—",
      latestDelta:
        (latest?.newlyAppointedTotal ?? 0) -
        (previous?.newlyAppointedTotal ?? 0),
    },
  ];
  const summaryRows: ComparisonSummaryRow[] = [
    {
      label: "Ψήφισαν",
      latestValue: latest?.voted ?? "—",
      previousValue: previous?.voted ?? "—",
      latestDelta: (latest?.voted ?? 0) - (previous?.voted ?? 0),
    },
    {
      label: "Άκυρα - Λευκά",
      latestValue: latest?.invalidBlank ?? "—",
      previousValue: previous?.invalidBlank ?? "—",
      latestDelta: (latest?.invalidBlank ?? 0) - (previous?.invalidBlank ?? 0),
    },
    {
      label: "Έγκυρα",
      latestValue: latest?.valid ?? "—",
      previousValue: previous?.valid ?? "—",
      latestDelta: (latest?.valid ?? 0) - (previous?.valid ?? 0),
    },
  ];

  return (
    <article className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-6 shadow-[0_16px_50px_rgba(60,44,28,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
            {title}
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            {primary?.electionType}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700">
            {latestLabel} vs {previousLabel}
          </div>
          <TermYearsBadge value={primary?.termYears} />
        </div>
      </div>

      <ComparisonInfoStrip
        rows={metadataRows}
        latestLabel={latestLabel}
        previousLabel={previousLabel}
      />
      <ComparisonSummaryTable rows={summaryRows} latestLabel={latestLabel} previousLabel={previousLabel} />

      <ComparisonRowsTable
        rows={rows}
        latestLabel={latestLabel}
        previousLabel={previousLabel}
      />
    </article>
  );
}

function AggregateComparisonCard({
  title,
  comparisonCycle,
  coverage,
  latest,
  previous,
  rowOrder,
}: {
  title: string;
  comparisonCycle: ComparisonCycleView | null;
  coverage: AggregateCoverageView;
  latest: AggregateElectionView | null;
  previous: AggregateElectionView | null;
  rowOrder: string[];
}) {
  const currentCycleLabel = comparisonCycle
    ? comparisonCycle.currentYear.toString()
    : "—";
  const comparisonLabel = comparisonCycle?.comparisonLabel ?? `με ${previous?.yearLabel ?? "—"}`;

  if (!latest && !previous) {
    return (
      <article className="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
              {title}
            </div>
            <div className="mt-3 text-sm leading-7 text-stone-600">
              {comparisonCycle ? (
                <>
                  Δεν υπάρχουν ακόμη αποθηκευμένες τρέχουσες αρχαιρεσίες για τον
                  κύκλο {` ${currentCycleLabel} `}σε αυτή τη θέση.
                </>
              ) : (
                "Δεν υπάρχουν αρκετά αποθηκευμένα αποτελέσματα για συγκεντρωτικό σε αυτή τη θέση."
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {comparisonCycle ? (
              <div className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">
                Κύκλος {currentCycleLabel}
              </div>
            ) : null}
            {comparisonCycle ? (
              <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
                Σύγκριση {comparisonLabel}
              </div>
            ) : null}
            <div className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-900">
              Κάλυψη {coverage.currentCount} / {coverage.totalElmeCount} ΕΛΜΕ
            </div>
          </div>
        </div>
      </article>
    );
  }

  const primary = latest ?? previous;
  const latestLabel = latest?.yearLabel ?? "Τελευταίο";
  const previousLabel = previous?.yearLabel ?? "Προηγούμενο";
  const rows = buildComparisonRows(latest?.results ?? [], previous?.results ?? [], rowOrder);
  const metadataRows: ComparisonSummaryRow[] = [
    {
      label: "Υποψήφιοι",
      latestValue: latest?.candidatesTotal ?? "—",
      previousValue: previous?.candidatesTotal ?? "—",
      latestDelta: (latest?.candidatesTotal ?? 0) - (previous?.candidatesTotal ?? 0),
    },
    {
      label: "Αναπληρωτές",
      latestValue: latest?.substitutesTotal ?? "—",
      previousValue: previous?.substitutesTotal ?? "—",
      latestDelta:
        (latest?.substitutesTotal ?? 0) - (previous?.substitutesTotal ?? 0),
    },
    {
      label: "Νεοδιόριστοι",
      latestValue: latest?.newlyAppointedTotal ?? "—",
      previousValue: previous?.newlyAppointedTotal ?? "—",
      latestDelta:
        (latest?.newlyAppointedTotal ?? 0) -
        (previous?.newlyAppointedTotal ?? 0),
    },
  ];
  const summaryRows: ComparisonSummaryRow[] = [
    {
      label: "Ψήφισαν",
      latestValue: latest?.voted ?? "—",
      previousValue: previous?.voted ?? "—",
      latestDelta: (latest?.voted ?? 0) - (previous?.voted ?? 0),
    },
    {
      label: "Άκυρα - Λευκά",
      latestValue: latest?.invalidBlank ?? "—",
      previousValue: previous?.invalidBlank ?? "—",
      latestDelta: (latest?.invalidBlank ?? 0) - (previous?.invalidBlank ?? 0),
    },
    {
      label: "Έγκυρα",
      latestValue: latest?.valid ?? "—",
      previousValue: previous?.valid ?? "—",
      latestDelta: (latest?.valid ?? 0) - (previous?.valid ?? 0),
    },
  ];

  return (
    <article className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-6 shadow-[0_16px_50px_rgba(60,44,28,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
            {title}
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            {primary?.electionType}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700">
            Κύκλος {currentCycleLabel}
          </div>
          <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
            Σύγκριση {comparisonLabel}
          </div>
          <div className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-900">
            Κάλυψη {coverage.currentCount} / {coverage.totalElmeCount} ΕΛΜΕ
          </div>
          {coverage.previousCount < coverage.currentCount ? (
            <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
              Προηγούμενα διαθέσιμα {coverage.previousCount} / {coverage.currentCount}
            </div>
          ) : null}
        </div>
      </div>

      <ComparisonInfoStrip
        rows={metadataRows}
        latestLabel={latestLabel}
        previousLabel={previousLabel}
      />
      <ComparisonSummaryTable rows={summaryRows} latestLabel={latestLabel} previousLabel={previousLabel} />

      <ComparisonRowsTable
        rows={rows}
        latestLabel={latestLabel}
        previousLabel={previousLabel}
      />
    </article>
  );
}

export function HomeDashboard() {
  const [mode, setMode] = useState<Mode>("entry");
  const [selectedRegionId, setSelectedRegionId] = useState("attiki");
  const [selectedElmeName, setSelectedElmeName] = useState("ΝΟΤΙΑΣ ΑΘΗΝΑΣ");
  const [selectedElectionType, setSelectedElectionType] =
    useState<ElectionType>("Δ.Σ.");
  const [selectedEditingYear, setSelectedEditingYear] = useState("");
  const [kentrikiMakedoniaView, setKentrikiMakedoniaView] =
    useState<KentrikiMakedoniaView>("all");
  const [context, setContext] = useState<ElectionContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [editChangeNote, setEditChangeNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<EntryFormState>(() =>
    buildInitialFormState({
      regionName: "Αττική",
      elmeName: "ΝΟΤΙΑΣ ΑΘΗΝΑΣ",
      electionType: "Δ.Σ.",
      electionYear: null,
      termYears: 1,
      electionDate: null,
    }),
  );

  const selectedRegion = regionLookup.get(selectedRegionId) as RegionOption;
  const visibleElmes = getVisibleElmes(selectedRegion, kentrikiMakedoniaView);
  const selectedElme =
    visibleElmes.find((entry) => entry.name === selectedElmeName) ?? visibleElmes[0];
  const thessalonikiCount = selectedRegion.elmes.filter(
    (entry) => entry.isThessalonikiSubgroup,
  ).length;
  const otherKentrikiCount = selectedRegion.elmes.length - thessalonikiCount;
  const presentationRowOrder = buildPresentationRowOrder(context);
  const availableEditingYears = context?.editing.availableYears ?? [];
  const selectedEditingElection = context?.editing.selectedElection ?? null;
  const isEntryMode = mode === "entry";
  const isEditMode = mode === "edit";
  const isFormMode = isEntryMode || isEditMode;
  const formValidation = buildFormValidation(formState);

  useEffect(() => {
    if (!visibleElmes.some((entry) => entry.name === selectedElmeName)) {
      setSelectedElmeName(visibleElmes[0]?.name ?? "");
    }
  }, [selectedElmeName, visibleElmes]);

  useEffect(() => {
    if (!selectedElme?.name) {
      return;
    }

    const controller = new AbortController();

    async function loadContext() {
      setContextLoading(true);
      setContextError("");

      try {
        const selectedElectionYearQuery = selectedEditingYear
          ? `&selectedElectionYear=${encodeURIComponent(selectedEditingYear)}`
          : "";
        const response = await fetch(
          `/api/election-context?elmeName=${encodeURIComponent(selectedElme.name)}&electionType=${encodeURIComponent(selectedElectionType)}&regionName=${encodeURIComponent(selectedRegion.name)}&subgroupView=${encodeURIComponent(kentrikiMakedoniaView)}${selectedElectionYearQuery}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const payload = await readJsonPayload<ElectionContext & { error?: string }>(
          response,
        );

        if (!response.ok) {
          throw new Error(payload.error ?? "Απέτυχε η φόρτωση των αποτελεσμάτων.");
        }

        setContext(payload);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setContext(null);
        setContextError(
          error instanceof Error
            ? error.message
            : "Απέτυχε η φόρτωση των αποτελεσμάτων.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setContextLoading(false);
        }
      }
    }

    void loadContext();

    return () => controller.abort();
  }, [
    kentrikiMakedoniaView,
    selectedElectionType,
    selectedEditingYear,
    selectedElme?.name,
    selectedRegion.name,
  ]);

  useEffect(() => {
    if (!context) {
      return;
    }

    if (mode === "edit" && context.editing.selectedElection) {
      setFormState(buildFormStateFromElection(context.editing.selectedElection));
    } else {
      setFormState(buildInitialFormState(context.entryDefaults));
    }
    const nextEditingYear =
      context.editing.selectedElection?.electionYear?.toString() ??
      context.editing.availableYears[0]?.toString() ??
      "";
    setSelectedEditingYear(nextEditingYear);
    setEditChangeNote("");
    setSaveMessage("");
    setSaveError("");
  }, [context, mode]);

  const handleSelectRegion = (regionId: string) => {
    const nextRegion = regionLookup.get(regionId);
    if (!nextRegion) {
      return;
    }

    const nextView: KentrikiMakedoniaView = "all";
    const nextVisibleElmes = getVisibleElmes(nextRegion, nextView);

    setSelectedRegionId(regionId);
    setKentrikiMakedoniaView(nextView);
    setSelectedElmeName(nextVisibleElmes[0]?.name ?? "");
  };

  const updateCoreRow = (
    index: number,
    field: keyof ResultInputRow,
    value: string,
  ) => {
    setFormState((current) => ({
      ...current,
      coreRows: current.coreRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    }));
  };

  const updateExtraRow = (
    index: number,
    field: keyof ResultInputRow,
    value: string,
  ) => {
    setFormState((current) => ({
      ...current,
      extraRows: current.extraRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const electionYear = parseInteger(formState.electionYear);

      if (electionYear < 1900) {
        throw new Error("Συμπλήρωσε έγκυρη χρονιά αναμέτρησης.");
      }

      if (formValidation.errors.length) {
        throw new Error(formValidation.errors[0]);
      }

      const payload = {
        elmeName: selectedElme.name,
        electionType: selectedElectionType,
        electionYear,
        termYears: formState.termYears === "2" ? 2 : 1,
        electionDate: formState.electionDate || null,
        registeredVoters: 0,
        voted: parseInteger(formState.voted),
        invalidBlank: parseInteger(formState.invalidBlank),
        valid: parseInteger(formState.valid),
        candidatesTotal: parseInteger(formState.candidatesTotal),
        substitutesTotal: parseInteger(formState.substitutesTotal),
        newlyAppointedTotal: parseInteger(formState.newlyAppointedTotal),
        notes: formState.notes,
        changeNote: mode === "edit" ? editChangeNote.trim() || null : null,
        results: [...formState.coreRows, ...formState.extraRows]
          .filter((row) => {
            const hasText = row.canonicalName.trim();
            const hasNumbers = row.votes.trim() || row.seats.trim();
            return Boolean(hasText || hasNumbers);
          })
          .map((row) => ({
            canonicalName: row.canonicalName.trim(),
            rawLabel: row.canonicalName.trim(),
            votes: parseInteger(row.votes),
            seats: parseInteger(row.seats),
          })),
      };

      const response = await fetch("/api/elections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await readJsonPayload<{
        error?: string;
        message?: string;
        context?: ElectionContext;
      }>(response);

      if (!response.ok) {
        throw new Error(data.error ?? "Απέτυχε η αποθήκευση.");
      }

      setSaveMessage(
        data.message ??
          (mode === "edit"
            ? "Οι αλλαγές αποθηκεύτηκαν."
            : "Η αναμέτρηση αποθηκεύτηκε."),
      );
      setSaveError("");
      if (data.context) {
        setContext(data.context);
      }
    } catch (error) {
      setSaveMessage("");
      setSaveError(
        error instanceof Error ? error.message : "Απέτυχε η αποθήκευση.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-6 md:px-8 md:py-8">
      <section className="grid gap-6 overflow-hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(145deg,rgba(255,251,245,0.96),rgba(247,236,220,0.78))] p-7 shadow-[0_24px_80px_rgba(61,42,23,0.12)] md:p-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="overflow-x-auto whitespace-nowrap text-[clamp(1.35rem,3.6vw,4.4rem)] font-black tracking-[-0.05em] text-red-900">
              Σύστημα καταγραφής εκλογών ΕΛΜΕ
            </h2>
            <Link
              href="/settings"
              className="inline-flex h-11 items-center rounded-full border border-stone-300 bg-white/80 px-5 text-sm font-semibold text-stone-900 transition hover:border-stone-950 hover:bg-white"
            >
              Ρυθμίσεις
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <ModeCard
              mode="entry"
              selected={mode === "entry"}
              title="Πέρασμα αποτελεσμάτων"
              onSelect={setMode}
            />
            <ModeCard
              mode="edit"
              selected={mode === "edit"}
              title="Επεξεργασία"
              onSelect={setMode}
            />
            <ModeCard
              mode="presentation"
              selected={mode === "presentation"}
              title="Παρουσίαση"
              onSelect={setMode}
            />
          </div>
          <div className="grid gap-3 rounded-[1.75rem] border border-stone-300/70 bg-stone-950 p-4 text-stone-50 md:grid-cols-4">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                Περιοχή
              </div>
              <div className="mt-2 text-xl font-semibold text-stone-50">
                {selectedRegion.name}
              </div>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                Mode
              </div>
              <div className="mt-2 text-lg font-semibold text-stone-50">
                {mode === "entry"
                  ? "Πέρασμα αποτελεσμάτων"
                  : mode === "edit"
                    ? "Επεξεργασία"
                    : "Παρουσίαση"}
              </div>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                ΕΛΜΕ περιοχής
              </div>
              <div className="mt-2 text-xl font-semibold text-stone-50">
                {selectedRegion.elmes.length}
              </div>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                Επιλεγμένη ΕΛΜΕ
              </div>
              <div className="mt-2 text-lg font-semibold text-stone-50">
                {selectedElme.name}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-6 shadow-[0_16px_50px_rgba(60,44,28,0.08)]">
          <SectionTitle
            eyebrow="Βήμα 1"
            title="Χάρτης περιοχών"
            text="Επίλεξε περιοχή στον χάρτη. Η επιλογή φιλτράρει τις διαθέσιμες ΕΛΜΕ και στις δύο ροές."
          />
          <div className="mt-6">
            <GreeceMap
              selectedRegionId={selectedRegionId}
              onSelectRegion={handleSelectRegion}
            />
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-6 shadow-[0_16px_50px_rgba(60,44,28,0.08)]">
          <SectionTitle
            eyebrow="Βήμα 2"
            title="Περιοχή, ΕΛΜΕ και τύπος αναμέτρησης"
            text="Μετά την περιοχή διαλέγεις ΕΛΜΕ και τον τύπο αναμέτρησης. Από εδώ τροφοδοτείται είτε η κενή φόρμα είτε η παρουσίαση."
          />

          {selectedRegion.id === "kentriki-makedonia" ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { id: "all", label: `Όλες (${selectedRegion.elmes.length})` },
                { id: "thessaloniki", label: `Θεσσαλονίκη (${thessalonikiCount})` },
                { id: "rest", label: `Λοιπές ΕΛΜΕ (${otherKentrikiCount})` },
              ].map((option) => {
                const selected = kentrikiMakedoniaView === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setKentrikiMakedoniaView(option.id as KentrikiMakedoniaView)
                    }
                    className={`rounded-full border px-4 py-3 text-sm font-medium transition ${
                      selected
                        ? "border-stone-950 bg-stone-950 text-white"
                        : "border-stone-300 bg-stone-50 text-stone-700 hover:border-stone-950 hover:text-stone-950"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className={`${selectedRegion.id === "kentriki-makedonia" ? "mt-4" : "mt-6"} flex flex-wrap gap-3`}>
            {visibleElmes.map((entry) => {
              const selected = entry.name === selectedElme.name;
              return (
                <button
                  key={entry.name}
                  type="button"
                  onClick={() => setSelectedElmeName(entry.name)}
                  className={`rounded-full border px-4 py-3 text-sm font-medium transition ${
                    selected
                      ? "border-stone-950 bg-stone-950 text-white"
                      : "border-stone-300 bg-stone-50 text-stone-700 hover:border-stone-950 hover:text-stone-950"
                  }`}
                >
                  {entry.name}
                  {entry.isThessalonikiSubgroup ? (
                    <span className="ml-2 rounded-full bg-white/20 px-2 py-1 text-[11px] uppercase tracking-[0.18em]">
                      Θεσ/νίκη
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Περιοχή">
              <TextInput value={selectedRegion.name} readOnly />
            </Field>
            <Field label="ΕΛΜΕ">
              <TextInput value={selectedElme.name} readOnly />
            </Field>
            <Field label="Τύπος αναμέτρησης">
              <SelectInput
                value={selectedElectionType}
                options={["Δ.Σ.", "ΟΜΟΣΠΟΝΔΙΑ"]}
                onChange={(value) => setSelectedElectionType(value as ElectionType)}
              />
            </Field>
          </div>

          {contextError ? (
            <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {contextError}
            </div>
          ) : null}
        </article>
      </section>

      {isFormMode ? (
        <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <article className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-7 shadow-[0_16px_50px_rgba(60,44,28,0.08)]">
            <SectionTitle
              eyebrow={isEditMode ? "Επεξεργασία" : "Πέρασμα"}
              title={
                isEditMode
                  ? "Επεξεργασία αποθηκευμένης αναμέτρησης"
                  : "Κενή φόρμα καταχώρισης"
              }
              text={
                isEditMode
                  ? "Επιλέγεις αποθηκευμένη χρονιά, η φόρμα γεμίζει από τη βάση και κάθε αλλαγή κρατά ιστορικό."
                  : "Η φόρμα ανοίγει κενή στα αποτελέσματα, αλλά προσυμπληρώνει περιοχή, ΕΛΜΕ, χρονολογία και διάρκεια θητείας από τη βάση."
              }
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Περιοχή">
                <TextInput
                  value={context?.entryDefaults.regionName ?? selectedRegion.name}
                  readOnly
                />
              </Field>
              <Field label="ΕΛΜΕ">
                <TextInput value={selectedElme.name} readOnly />
              </Field>
              {isEditMode ? (
                <Field label="Χρονιά προς επεξεργασία">
                  <SelectInput
                    value={
                      availableEditingYears.length
                        ? selectedEditingYear
                        : "Δεν υπάρχουν αποθηκευμένες χρονιές"
                    }
                    options={
                      availableEditingYears.length
                        ? availableEditingYears.map((year) => year.toString())
                        : ["Δεν υπάρχουν αποθηκευμένες χρονιές"]
                    }
                    onChange={(value) => {
                      if (!availableEditingYears.length) {
                        return;
                      }

                      setSelectedEditingYear(value);
                    }}
                  />
                </Field>
              ) : null}
              <Field label="Χρονιά αναμέτρησης">
                <TextInput
                  type="number"
                  value={formState.electionYear}
                  readOnly={isEditMode}
                  onChange={
                    isEditMode
                      ? undefined
                      : (value) =>
                          setFormState((current) => ({
                            ...current,
                            electionYear: value,
                          }))
                  }
                  placeholder="2026"
                />
              </Field>
              <Field label="Τύπος αναμέτρησης">
                <TextInput value={selectedElectionType} readOnly />
              </Field>
              <Field label="Διάρκεια θητείας (έτη)">
                <SelectInput
                  value={formState.termYears}
                  options={["1", "2"]}
                  onChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      termYears: value as "1" | "2",
                    }))
                  }
                />
              </Field>
              <Field label="Ημερομηνία εκλογών">
                <TextInput
                  type="date"
                  value={formState.electionDate}
                  onChange={(value) =>
                    setFormState((current) => ({ ...current, electionDate: value }))
                  }
                />
              </Field>
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {isEditMode ? (
                <>
                  Επεξεργάζεσαι την αποθηκευμένη αναμέτρηση του{" "}
                  <span className="font-semibold">
                    {selectedEditingYear || "—"}
                  </span>
                  . Πριν αποθηκευτούν οι αλλαγές, κρατιέται snapshot στο ιστορικό.
                </>
              ) : (
                <>
                  Η αναμέτρηση αποθηκεύεται μόνο με τη χρονιά λήξης, π.χ.{" "}
                  <span className="font-semibold">2025-2026 → 2026</span>. Η
                  θητεία παραμένει ξεχωριστά ως{" "}
                  <span className="font-semibold">
                    {formatTermYears(formState.termYears === "2" ? 2 : 1)}
                  </span>
                  .
                </>
              )}
            </div>
            {isEditMode && !availableEditingYears.length ? (
              <div className="mt-4 rounded-[1.35rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                Δεν υπάρχει αποθηκευμένη αναμέτρηση για επεξεργασία σε αυτή την
                ΕΛΜΕ και σε αυτόν τον τύπο.
              </div>
            ) : null}
            {formValidation.errors.length ? (
              <div className="mt-4 rounded-[1.35rem] border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {formValidation.errors.map((error) => (
                  <div key={error}>{error}</div>
                ))}
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Field label="Υποψήφιοι">
                <TextInput
                  type="number"
                  value={formState.candidatesTotal}
                  onChange={(value) =>
                    setFormState((current) => ({ ...current, candidatesTotal: value }))
                  }
                />
              </Field>
              <Field label="Αναπληρωτές">
                <TextInput
                  type="number"
                  value={formState.substitutesTotal}
                  onChange={(value) =>
                    setFormState((current) => ({ ...current, substitutesTotal: value }))
                  }
                />
              </Field>
              <Field label="Νεοδιόριστοι">
                <TextInput
                  type="number"
                  value={formState.newlyAppointedTotal}
                  onChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      newlyAppointedTotal: value,
                    }))
                  }
                />
              </Field>
            </div>

            <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-stone-200">
              <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr] gap-3 border-b border-stone-200 bg-stone-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                <div>Στοιχείο</div>
                <div>Τιμή</div>
                <div>Έλεγχος</div>
              </div>
              <div className="grid">
                <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr] gap-3 border-b border-stone-200 px-4 py-3">
                  <div className="flex items-center rounded-2xl bg-stone-50 px-4 text-sm font-medium text-stone-800">
                    Ψήφισαν
                  </div>
                  <TextInput
                    type="number"
                    value={formState.voted}
                    invalid={!formValidation.turnoutMatchesTotals}
                    onChange={(value) =>
                      setFormState((current) => ({ ...current, voted: value }))
                    }
                  />
                  <div
                    className={`flex items-center rounded-2xl px-4 text-sm font-semibold ${
                      formValidation.turnoutMatchesTotals
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-rose-50 text-rose-800"
                    }`}
                  >
                    {formValidation.turnoutMatchesTotals
                      ? "ΟΚ"
                      : `${parseInteger(formState.valid) + parseInteger(formState.invalidBlank)}`}
                  </div>
                </div>
                <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr] gap-3 border-b border-stone-200 px-4 py-3">
                  <div className="flex items-center rounded-2xl bg-stone-50 px-4 text-sm font-medium text-stone-800">
                    Άκυρα - Λευκά
                  </div>
                  <TextInput
                    type="number"
                    value={formState.invalidBlank}
                    invalid={!formValidation.turnoutMatchesTotals}
                    onChange={(value) =>
                      setFormState((current) => ({ ...current, invalidBlank: value }))
                    }
                  />
                  <div
                    className={`flex items-center rounded-2xl px-4 text-sm ${
                      formValidation.turnoutMatchesTotals
                        ? "bg-stone-50 text-stone-500"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {formValidation.turnoutMatchesTotals
                      ? "με τα έγκυρα = ψήφισαν"
                      : "μαζί με τα έγκυρα"}
                  </div>
                </div>
                <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr] gap-3 border-b border-stone-200 px-4 py-3">
                  <div className="flex items-center rounded-2xl bg-stone-50 px-4 text-sm font-medium text-stone-800">
                    Έγκυρα
                  </div>
                  <TextInput
                    type="number"
                    value={formState.valid}
                    invalid={
                      !formValidation.totalsMatchValid ||
                      !formValidation.turnoutMatchesTotals
                    }
                    onChange={(value) =>
                      setFormState((current) => ({ ...current, valid: value }))
                    }
                  />
                  <div
                    className={`flex items-center rounded-2xl px-4 text-sm font-semibold ${
                      formValidation.totalsMatchValid
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-rose-50 text-rose-800"
                    }`}
                  >
                    {formValidation.totalsMatchValid
                      ? `ψήφοι παρατάξεων ${formValidation.sumVotes}`
                      : `παρατάξεις ${formValidation.sumVotes}`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr] gap-3 border-b border-stone-200 bg-stone-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                <div>Παράταξη</div>
                <div>Ψήφοι</div>
                <div>Έδρες</div>
              </div>

              <div className="grid">
                {formState.coreRows.map((row, index) => (
                  <div
                    key={row.canonicalName}
                    className={`grid grid-cols-[1.8fr_0.8fr_0.8fr] gap-3 border-b border-stone-200 px-4 py-3 last:border-b-0 ${getSlateStyle(row.canonicalName).rowClass}`}
                  >
                    <div
                      className={`flex items-center gap-3 rounded-2xl px-4 text-sm font-medium ${getSlateStyle(row.canonicalName).textClass}`}
                    >
                      <span
                        className={`h-6 w-1 rounded-full ${getSlateStyle(row.canonicalName).stripeClass}`}
                      />
                      {row.canonicalName}
                    </div>
                    <TextInput
                      type="number"
                      value={row.votes}
                      onChange={(value) => updateCoreRow(index, "votes", value)}
                    />
                    <TextInput
                      type="number"
                      value={row.seats}
                      onChange={(value) => updateCoreRow(index, "seats", value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
                Πρόσθετες παρατάξεις ή συμπτύξεις
              </div>
              <div className="mt-4 grid gap-3">
                {formState.extraRows.map((row, index) => (
                  <div
                    key={`extra-${index}`}
                    className={`grid grid-cols-[1.6fr_0.8fr_0.8fr] gap-3 ${
                      row.canonicalName.trim()
                        ? getSlateStyle(row.canonicalName).rowClass
                        : ""
                    }`}
                  >
                    <TextInput
                      value={row.canonicalName}
                      placeholder="Όνομα παράταξης"
                      invalid={formValidation.unnamedExtraRows.includes(index)}
                      onChange={(value) => updateExtraRow(index, "canonicalName", value)}
                    />
                    <TextInput
                      type="number"
                      value={row.votes}
                      invalid={formValidation.unnamedExtraRows.includes(index)}
                      onChange={(value) => updateExtraRow(index, "votes", value)}
                    />
                    <TextInput
                      type="number"
                      value={row.seats}
                      invalid={formValidation.unnamedExtraRows.includes(index)}
                      onChange={(value) => updateExtraRow(index, "seats", value)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFormState((current) => ({
                      ...current,
                      extraRows: [
                        ...current.extraRows,
                        {
                          canonicalName: "",
                          votes: "",
                          seats: "",
                        },
                      ],
                    }))
                  }
                  className="h-11 rounded-full border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-800"
                >
                  Προσθήκη γραμμής
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-2">
              <Field label="Σημειώσεις">
                <textarea
                  rows={5}
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, notes: event.target.value }))
                  }
                  className="rounded-[1.5rem] border border-stone-300 bg-white px-4 py-3 text-sm leading-7 text-stone-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                />
              </Field>
            </div>
          </article>

          <aside className="grid gap-6">
            <article className="rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(180deg,#174e57,#112f35)] p-7 text-stone-50 shadow-[0_16px_50px_rgba(16,48,53,0.18)]">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-teal-100/70">
                {isEditMode ? "Ροή επεξεργασίας" : "Ροή καταχώρισης"}
              </div>
              <ol className="mt-4 space-y-4 text-sm leading-7 text-teal-50/90">
                <li>1. Επιλογή περιοχής και ΕΛΜΕ από τον χάρτη.</li>
                <li>
                  2.{" "}
                  {isEditMode
                    ? "Επιλογή της αποθηκευμένης χρονιάς που θέλεις να αλλάξεις."
                    : "Προσυμπλήρωση βασικών στοιχείων αναμέτρησης."}
                </li>
                <li>
                  3.{" "}
                  {isEditMode
                    ? "Διόρθωση totals, ψήφων και σημειώσεων."
                    : "Συμπλήρωση totals και ψήφων."}
                </li>
                <li>
                  4.{" "}
                  {isEditMode
                    ? "Αποθήκευση με αυτόματο ιστορικό αλλαγών."
                    : "Αποθήκευση στη βάση."}
                </li>
              </ol>
            </article>

            <article className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-7 shadow-[0_16px_50px_rgba(60,44,28,0.08)]">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
                {isEditMode ? "Ενέργειες επεξεργασίας" : "Actions"}
              </div>
              {isEditMode ? (
                <div className="mt-5 grid gap-2">
                  <Field label="Σχόλιο αλλαγής">
                    <TextInput
                      value={editChangeNote}
                      placeholder="π.χ. Διόρθωση ψήφων ΣΥΝΕΚ"
                      onChange={setEditChangeNote}
                    />
                  </Field>
                </div>
              ) : null}
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={
                    isSaving ||
                    contextLoading ||
                    (isEditMode && !selectedEditingElection) ||
                    formValidation.errors.length > 0
                  }
                  className="h-12 rounded-full bg-stone-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
                >
                  {isSaving
                    ? "Αποθήκευση..."
                    : isEditMode
                      ? "Αποθήκευση αλλαγών"
                      : "Αποθήκευση αποτελεσμάτων"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("presentation")}
                  className="h-12 rounded-full border border-stone-300 bg-stone-50 px-5 text-sm font-semibold text-stone-800"
                >
                  Μετάβαση στην παρουσίαση
                </button>
              </div>
              {saveMessage ? (
                <p className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {saveMessage}
                </p>
              ) : null}
              {saveError ? (
                <p className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {saveError}
                </p>
              ) : null}
              {contextLoading ? (
                <p className="mt-5 text-sm text-stone-500">Φόρτωση στοιχείων αναμέτρησης...</p>
              ) : null}
            </article>
            {isEditMode ? (
              <article className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-7 shadow-[0_16px_50px_rgba(60,44,28,0.08)]">
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
                  Ιστορικό αλλαγών
                </div>
                <div className="mt-5 grid gap-3">
                  {context?.editing.revisions.length ? (
                    context.editing.revisions.map((revision) => (
                      <div
                        key={revision.id}
                        className="rounded-[1.35rem] border border-stone-200 bg-stone-50 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-semibold text-stone-900">
                            {revision.electionYear}
                          </span>
                          <span className="text-stone-500">
                            {formatRevisionTimestamp(revision.changedAt)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm leading-6 text-stone-600">
                          {revision.changeNote || "Χωρίς σχόλιο αλλαγής."}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.35rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-600">
                      Δεν υπάρχουν προηγούμενες αποθηκευμένες επεξεργασίες για
                      αυτή την αναμέτρηση.
                    </div>
                  )}
                </div>
              </article>
            ) : null}
          </aside>
        </section>
      ) : (
        <section className="grid gap-6">
          {contextLoading ? (
            <article className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-7 shadow-[0_16px_50px_rgba(60,44,28,0.08)]">
              <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-600">
                Φόρτωση αποθηκευμένων αναμετρήσεων...
              </div>
            </article>
          ) : null}

          <PresentationComparisonCard
            title="Αποτελέσματα ΕΛΜΕ"
            latest={context?.presentation.latest ?? null}
            previous={context?.presentation.previous ?? null}
            rowOrder={presentationRowOrder}
          />

          <div className="grid gap-8">
            <section className="grid gap-6">
              <article className="rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(180deg,#174e57,#112f35)] p-7 text-stone-50 shadow-[0_16px_50px_rgba(16,48,53,0.18)]">
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-teal-100/70">
                  Συγκεντρωτικά περιοχής
                </div>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                  {context?.aggregates.region.scopeLabel ?? selectedRegion.name}
                </h3>
                <p className="mt-4 text-sm leading-7 text-teal-50/90">
                  Το συγκεντρωτικό αθροίζει μόνο τις ΕΛΜΕ που έχουν ήδη αποθηκευμένη
                  τρέχουσα αναμέτρηση στον ενεργό κύκλο σύγκρισης.
                </p>
              </article>

              <AggregateComparisonCard
                title="Συγκριτικό περιοχής"
                comparisonCycle={context?.aggregates.region.comparisonCycle ?? null}
                coverage={
                  context?.aggregates.region.coverage ?? {
                    totalElmeCount: 0,
                    currentCount: 0,
                    previousCount: 0,
                  }
                }
                latest={context?.aggregates.region.latest ?? null}
                previous={context?.aggregates.region.previous ?? null}
                rowOrder={presentationRowOrder}
              />
            </section>

            <section className="grid gap-6">
              <article className="rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(180deg,#3f2b19,#24170d)] p-7 text-stone-50 shadow-[0_16px_50px_rgba(54,34,16,0.18)]">
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-amber-100/70">
                  Συνολικό
                </div>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                  {context?.aggregates.national.scopeLabel ?? "Σύνολο χώρας"}
                </h3>
                <p className="mt-4 text-sm leading-7 text-amber-50/90">
                  Το συνολικό συγκεντρώνει μόνο τις ΕΛΜΕ που έχουν ήδη αποθηκευμένη
                  τρέχουσα αναμέτρηση στον ενεργό κύκλο σύγκρισης.
                </p>
              </article>

              <AggregateComparisonCard
                title="Συγκριτικό πανελλαδικό"
                comparisonCycle={context?.aggregates.national.comparisonCycle ?? null}
                coverage={
                  context?.aggregates.national.coverage ?? {
                    totalElmeCount: 0,
                    currentCount: 0,
                    previousCount: 0,
                  }
                }
                latest={context?.aggregates.national.latest ?? null}
                previous={context?.aggregates.national.previous ?? null}
                rowOrder={presentationRowOrder}
              />
            </section>
          </div>
        </section>
      )}
    </main>
  );
}
