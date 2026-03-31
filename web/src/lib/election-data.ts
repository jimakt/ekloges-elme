import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  comparisonCycles,
  electionResults,
  electionRevisions,
  elections,
  elme,
  regions,
  slates,
} from "@/db/schema";

export type ElectionType = "Δ.Σ." | "ΟΜΟΣΠΟΝΔΙΑ";
export type RegionSubgroupView = "all" | "thessaloniki" | "rest";

export type ElectionResultView = {
  canonicalName: string;
  votes: number;
  seats: number;
  percentage: number;
  isCore: boolean;
};

export type ElectionView = {
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

export type EntryDefaults = {
  regionName: string;
  elmeName: string;
  electionType: ElectionType;
  electionYear: number | null;
  termYears: 1 | 2;
  electionDate: string | null;
};

export type ElectionRevisionView = {
  id: number;
  electionYear: number;
  changedAt: string;
  changeNote: string;
};

export type ComparisonCycleView = {
  electionType: ElectionType;
  currentYear: number;
  previousYear: number;
  comparisonLabel: string;
};

export type ComparisonCycleMap = Record<ElectionType, ComparisonCycleView>;

export type ComparisonCycleHistoryItem = ComparisonCycleView & {
  id: number;
  isActive: boolean;
  updatedAt: string;
};

export type ComparisonCycleHistoryMap = Record<
  ElectionType,
  ComparisonCycleHistoryItem[]
>;

export type ComparisonCyclesState = {
  cycles: ComparisonCycleMap;
  history: ComparisonCycleHistoryMap;
};

export type AggregateCoverageView = {
  totalElmeCount: number;
  currentCount: number;
  previousCount: number;
};

export type ElectionContext = {
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

export type AggregateElectionView = {
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

export type AggregateScopeView = {
  scopeLabel: string;
  comparisonCycle: ComparisonCycleView | null;
  coverage: AggregateCoverageView;
  latest: AggregateElectionView | null;
  previous: AggregateElectionView | null;
};

export type SaveElectionResultInput = {
  canonicalName: string;
  rawLabel: string;
  votes: number;
  seats: number;
};

export type SaveComparisonCycleInput = {
  electionType: ElectionType;
  currentYear: number;
};

export type SaveElectionInput = {
  elmeName: string;
  electionType: ElectionType;
  electionYear: number;
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
  changeNote?: string | null;
  results: SaveElectionResultInput[];
};

type ElectionSnapshot = {
  election: {
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
  };
  results: ElectionResultView[];
};

type ElmeRecord = {
  id: number;
  name: string;
  regionName: string;
};

type ElectionResultRow = {
  electionId: number;
  slateId: number;
  canonicalName: string;
  votes: number;
  seats: number;
  isCore: boolean;
  displayOrder: number;
};

const DEFAULT_ENTRY_BY_TYPE: Record<ElectionType, Omit<EntryDefaults, "regionName" | "elmeName">> =
  {
    "Δ.Σ.": {
      electionType: "Δ.Σ.",
      electionYear: null,
      termYears: 1,
      electionDate: null,
    },
    "ΟΜΟΣΠΟΝΔΙΑ": {
      electionType: "ΟΜΟΣΠΟΝΔΙΑ",
      electionYear: null,
      termYears: 2,
      electionDate: null,
    },
  };

const DEFAULT_COMPARISON_CYCLES: Record<
  ElectionType,
  Omit<ComparisonCycleView, "electionType">
> = {
  "Δ.Σ.": {
    currentYear: 2026,
    previousYear: 2024,
  },
  ΟΜΟΣΠΟΝΔΙΑ: {
    currentYear: 2024,
    previousYear: 2022,
  },
};

function getComparisonCyclePreviousYear(
  electionType: ElectionType,
  currentYear: number,
) {
  if (electionType === "Δ.Σ.") {
    return currentYear - 2;
  }

  return currentYear - 2;
}

function getComparisonCycleLabel(
  electionType: ElectionType,
  currentYear: number,
) {
  if (electionType === "Δ.Σ.") {
    return `1ετείς με ${currentYear - 1} • 2ετείς με ${currentYear - 2}`;
  }

  return `με ${currentYear - 2}`;
}

function normalizeIdentifier(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/ΣΤ'/g, "ΣΤ")
    .replace(/[΄'’`´]/g, "")
    .replace(/ΘΕΣ\/ΝΙΚΗΣ/g, "ΘΕΣΣΑΛΟΝΙΚΗΣ")
    .replace(/[^0-9A-ZΑ-Ω]/gu, "");
}

function normalizeSubgroupView(
  regionName: string | null | undefined,
  subgroupView: RegionSubgroupView | null | undefined,
): RegionSubgroupView {
  if (regionName !== "Κεντρική Μακεδονία") {
    return "all";
  }

  return subgroupView === "thessaloniki" || subgroupView === "rest"
    ? subgroupView
    : "all";
}

function getScopeLabel(
  regionName: string | null | undefined,
  subgroupView: RegionSubgroupView,
) {
  if (!regionName) {
    return "Σύνολο χώρας";
  }

  if (regionName !== "Κεντρική Μακεδονία") {
    return regionName;
  }

  if (subgroupView === "thessaloniki") {
    return "Κεντρική Μακεδονία • Θεσσαλονίκη";
  }

  if (subgroupView === "rest") {
    return "Κεντρική Μακεδονία • Λοιπές ΕΛΜΕ";
  }

  return regionName;
}

async function getActiveComparisonCycle(
  electionType: ElectionType,
): Promise<ComparisonCycleView> {
  const [configuredCycle] = await db
    .select({
      electionType: comparisonCycles.electionType,
      currentYear: comparisonCycles.currentYear,
      previousYear: comparisonCycles.previousYear,
    })
    .from(comparisonCycles)
    .where(
      and(
        eq(comparisonCycles.electionType, electionType),
        eq(comparisonCycles.isActive, true),
      ),
    )
    .limit(1);

  if (configuredCycle) {
    return {
      electionType: configuredCycle.electionType as ElectionType,
      currentYear: configuredCycle.currentYear,
      previousYear: configuredCycle.previousYear,
      comparisonLabel: getComparisonCycleLabel(
        configuredCycle.electionType as ElectionType,
        configuredCycle.currentYear,
      ),
    };
  }

  const fallback = DEFAULT_COMPARISON_CYCLES[electionType];

  return {
    electionType,
    currentYear: fallback.currentYear,
    previousYear: fallback.previousYear,
    comparisonLabel: getComparisonCycleLabel(electionType, fallback.currentYear),
  };
}

async function getComparisonCycleHistory(
  electionType: ElectionType,
): Promise<ComparisonCycleHistoryItem[]> {
  const rows = await db
    .select({
      id: comparisonCycles.id,
      electionType: comparisonCycles.electionType,
      currentYear: comparisonCycles.currentYear,
      previousYear: comparisonCycles.previousYear,
      isActive: comparisonCycles.isActive,
      updatedAt: comparisonCycles.updatedAt,
    })
    .from(comparisonCycles)
    .where(eq(comparisonCycles.electionType, electionType))
    .orderBy(
      desc(comparisonCycles.isActive),
      desc(comparisonCycles.currentYear),
      desc(comparisonCycles.updatedAt),
      desc(comparisonCycles.id),
    );

  return rows.map((row) => ({
    id: row.id,
    electionType: row.electionType as ElectionType,
    currentYear: row.currentYear,
    previousYear: row.previousYear,
    comparisonLabel: getComparisonCycleLabel(
      row.electionType as ElectionType,
      row.currentYear,
    ),
    isActive: row.isActive,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

function buildAggregateComparisonLabel(
  currentRows: (typeof elections.$inferSelect)[],
  cycle: ComparisonCycleView,
) {
  if (!currentRows.length) {
    return `με ${cycle.previousYear}`;
  }

  const termYears = Array.from(
    new Set(currentRows.map((row) => (row.termYears === 2 ? 2 : 1))),
  ).sort((left, right) => left - right);

  if (termYears.length === 1) {
    return `με ${cycle.currentYear - termYears[0]}`;
  }

  return termYears
    .map((termYear) => `${termYear}ετείς με ${cycle.currentYear - termYear}`)
    .join(" • ");
}

function toElectionView(
  row: typeof elections.$inferSelect,
  results: ElectionResultView[],
): ElectionView {
  return {
    id: row.id,
    electionYear: row.electionYear,
    electionType: row.electionType as ElectionType,
    termYears: row.termYears === 2 ? 2 : 1,
    electionDate: row.electionDate,
    registeredVoters: row.registeredVoters,
    voted: row.voted,
    invalidBlank: row.invalidBlank,
    valid: row.valid,
    candidatesTotal: row.candidatesTotal,
    substitutesTotal: row.substitutesTotal,
    newlyAppointedTotal: row.newlyAppointedTotal,
    notes: row.notes,
    results,
  };
}

function buildElectionSnapshot(election: ElectionView): ElectionSnapshot {
  return {
    election: {
      id: election.id,
      electionYear: election.electionYear,
      electionType: election.electionType,
      termYears: election.termYears,
      electionDate: election.electionDate,
      registeredVoters: election.registeredVoters,
      voted: election.voted,
      invalidBlank: election.invalidBlank,
      valid: election.valid,
      candidatesTotal: election.candidatesTotal,
      substitutesTotal: election.substitutesTotal,
      newlyAppointedTotal: election.newlyAppointedTotal,
      notes: election.notes,
    },
    results: election.results,
  };
}

async function getElmeRecord(elmeName: string): Promise<ElmeRecord | null> {
  const [record] = await db
    .select({
      id: elme.id,
      name: elme.name,
      regionName: regions.name,
    })
    .from(elme)
    .innerJoin(regions, eq(elme.regionId, regions.id))
    .where(eq(elme.name, elmeName))
    .limit(1);

  return record ?? null;
}

async function getElmeRecordsForScope(
  regionName: string | null,
  subgroupView: RegionSubgroupView,
) {
  const filters = [];

  if (regionName) {
    filters.push(eq(regions.name, regionName));
  }

  if (subgroupView === "thessaloniki") {
    filters.push(eq(elme.isThessalonikiSubgroup, true));
  }

  if (subgroupView === "rest") {
    filters.push(eq(elme.isThessalonikiSubgroup, false));
  }

  const query = db
    .select({
      id: elme.id,
      name: elme.name,
      regionName: regions.name,
    })
    .from(elme)
    .innerJoin(regions, eq(elme.regionId, regions.id))
    .orderBy(asc(regions.sortOrder), asc(elme.sortOrder));

  if (!filters.length) {
    return query;
  }

  return query.where(and(...filters));
}

async function getOrderedElectionRows(elmeId: number, electionType: ElectionType) {
  return db
    .select()
    .from(elections)
    .where(
      and(eq(elections.elmeId, elmeId), eq(elections.electionType, electionType)),
    )
    .orderBy(
      desc(elections.electionYear),
      desc(elections.createdAt),
      desc(elections.id),
    );
}

async function getElectionRowsForElmesByYear(
  elmeIds: number[],
  electionType: ElectionType,
  electionYear: number,
) {
  if (!elmeIds.length) {
    return [] as (typeof elections.$inferSelect)[];
  }

  return db
    .select()
    .from(elections)
    .where(
      and(
        inArray(elections.elmeId, elmeIds),
        eq(elections.electionType, electionType),
        eq(elections.electionYear, electionYear),
      ),
    )
    .orderBy(asc(elections.elmeId), desc(elections.createdAt), desc(elections.id));
}

async function getElectionRowsForElmesByYears(
  elmeIds: number[],
  electionType: ElectionType,
  electionYears: number[],
) {
  if (!elmeIds.length || !electionYears.length) {
    return [] as (typeof elections.$inferSelect)[];
  }

  return db
    .select()
    .from(elections)
    .where(
      and(
        inArray(elections.elmeId, elmeIds),
        eq(elections.electionType, electionType),
        inArray(elections.electionYear, electionYears),
      ),
    )
    .orderBy(
      asc(elections.elmeId),
      desc(elections.electionYear),
      desc(elections.createdAt),
      desc(elections.id),
    );
}

async function getElectionResultRowsByElectionIds(electionIds: number[]) {
  if (!electionIds.length) {
    return [] as ElectionResultRow[];
  }

  return db
    .select({
      electionId: electionResults.electionId,
      slateId: electionResults.slateId,
      canonicalName: slates.name,
      votes: electionResults.votes,
      seats: electionResults.seats,
      isCore: slates.isCore,
      displayOrder: slates.displayOrder,
    })
    .from(electionResults)
    .innerJoin(slates, eq(electionResults.slateId, slates.id))
    .where(inArray(electionResults.electionId, electionIds))
    .orderBy(asc(slates.displayOrder), asc(slates.name));
}

async function getResultsByElectionIds(electionIds: number[]) {
  const rows = await getElectionResultRowsByElectionIds(electionIds);

  const grouped = new Map<number, ElectionResultView[]>();

  for (const row of rows) {
    if (!row.canonicalName.trim()) {
      continue;
    }

    const bucket = grouped.get(row.electionId) ?? [];
    bucket.push({
      canonicalName: row.canonicalName,
      votes: row.votes,
      seats: row.seats,
      percentage: 0,
      isCore: row.isCore,
    });
    grouped.set(row.electionId, bucket);
  }

  for (const electionId of electionIds) {
    const bucket = grouped.get(electionId);
    if (!bucket?.length) {
      continue;
    }

    const totalValidVotes = bucket.reduce((sum, result) => sum + result.votes, 0);

    grouped.set(
      electionId,
      bucket.map((result) => ({
        ...result,
        percentage: totalValidVotes > 0 ? result.votes / totalValidVotes : 0,
      })),
    );
  }

  return grouped;
}

async function getElectionRevisionViews(electionId: number) {
  return db
    .select({
      id: electionRevisions.id,
      electionYear: electionRevisions.electionYear,
      changedAt: electionRevisions.changedAt,
      changeNote: electionRevisions.changeNote,
    })
    .from(electionRevisions)
    .where(eq(electionRevisions.electionId, electionId))
    .orderBy(desc(electionRevisions.changedAt), desc(electionRevisions.id));
}

function buildAggregateElectionView(
  rows: (typeof elections.$inferSelect)[],
  resultRows: ElectionResultRow[],
  electionType: ElectionType,
  yearLabel: string,
): AggregateElectionView | null {
  if (!rows.length) {
    return null;
  }

  const electionIds = new Set(rows.map((row) => row.id));
  const aggregatedBySlate = new Map<
    number,
    Omit<ElectionResultView, "percentage"> & { displayOrder: number }
  >();

  for (const resultRow of resultRows) {
    if (!electionIds.has(resultRow.electionId)) {
      continue;
    }

    if (!resultRow.canonicalName.trim()) {
      continue;
    }

    const current = aggregatedBySlate.get(resultRow.slateId) ?? {
      canonicalName: resultRow.canonicalName,
      votes: 0,
      seats: 0,
      isCore: resultRow.isCore,
      displayOrder: resultRow.displayOrder,
    };

    current.votes += resultRow.votes;
    current.seats += resultRow.seats;
    aggregatedBySlate.set(resultRow.slateId, current);
  }

  const valid = rows.reduce((sum, row) => sum + row.valid, 0);

  return {
    yearLabel: yearLabel || "—",
    electionType,
    sourceCount: rows.length,
    voted: rows.reduce((sum, row) => sum + row.voted, 0),
    invalidBlank: rows.reduce((sum, row) => sum + row.invalidBlank, 0),
    valid,
    candidatesTotal: rows.reduce((sum, row) => sum + row.candidatesTotal, 0),
    substitutesTotal: rows.reduce((sum, row) => sum + row.substitutesTotal, 0),
    newlyAppointedTotal: rows.reduce(
      (sum, row) => sum + row.newlyAppointedTotal,
      0,
    ),
    results: Array.from(aggregatedBySlate.values())
      .sort((left, right) =>
        left.displayOrder === right.displayOrder
          ? left.canonicalName.localeCompare(right.canonicalName, "el")
          : left.displayOrder - right.displayOrder,
      )
      .map((result) => ({
        canonicalName: result.canonicalName,
        votes: result.votes,
        seats: result.seats,
        percentage: valid > 0 ? result.votes / valid : 0,
        isCore: result.isCore,
      })),
  };
}

async function getAggregateScopeView(
  regionName: string | null,
  subgroupView: RegionSubgroupView,
  electionType: ElectionType,
): Promise<AggregateScopeView> {
  const safeSubgroupView = normalizeSubgroupView(regionName, subgroupView);
  const elmeRecords = await getElmeRecordsForScope(regionName, safeSubgroupView);
  const cycle = await getActiveComparisonCycle(electionType);
  const totalElmeCount = elmeRecords.length;
  const latest = await getElectionRowsForElmesByYear(
    elmeRecords.map((record) => record.id),
    electionType,
    cycle.currentYear,
  );
  const previousYearByElme = new Map(
    latest.map((row) => [
      row.elmeId,
      row.electionYear - (row.termYears === 2 ? 2 : 1),
    ] as const),
  );
  const previousCandidates = await getElectionRowsForElmesByYears(
    latest.map((row) => row.elmeId),
    electionType,
    Array.from(new Set(previousYearByElme.values())).sort(
      (left, right) => right - left,
    ),
  );
  const previous = previousCandidates.filter(
    (row) => previousYearByElme.get(row.elmeId) === row.electionYear,
  );
  const resultRows = await getElectionResultRowsByElectionIds(
    [...latest, ...previous].map((row) => row.id),
  );
  const comparisonCycle = {
    ...cycle,
    comparisonLabel: buildAggregateComparisonLabel(latest, cycle),
  };

  return {
    scopeLabel: getScopeLabel(regionName, safeSubgroupView),
    comparisonCycle,
    coverage: {
      totalElmeCount,
      currentCount: latest.length,
      previousCount: previous.length,
    },
    latest: buildAggregateElectionView(
      latest,
      resultRows,
      electionType,
      cycle.currentYear.toString(),
    ),
    previous: buildAggregateElectionView(
      previous,
      resultRows,
      electionType,
      Array.from(new Set(previous.map((row) => row.electionYear)))
        .sort((left, right) => right - left)
        .map((value) => value.toString())
        .join(" / ") || cycle.previousYear.toString(),
    ),
  };
}

async function ensureSlate(canonicalName: string) {
  const [existing] = await db
    .select({
      id: slates.id,
    })
    .from(slates)
    .where(eq(slates.name, canonicalName))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const [maxRow] = await db
    .select({
      maxDisplayOrder: sql<number>`coalesce(max(${slates.displayOrder}), 0)`,
    })
    .from(slates);

  const [created] = await db
    .insert(slates)
    .values({
      code: `CUSTOM_${normalizeIdentifier(canonicalName) || randomUUID().slice(0, 8)}`,
      name: canonicalName,
      displayOrder: (maxRow?.maxDisplayOrder ?? 0) + 1,
      isCore: false,
      isActive: true,
    })
    .returning({
      id: slates.id,
    });

  return created.id;
}

export async function getElectionContext(
  elmeName: string,
  electionType: ElectionType,
  options?: {
    regionName?: string;
    subgroupView?: RegionSubgroupView;
    selectedElectionYear?: number;
  },
): Promise<ElectionContext | null> {
  const elmeRecord = await getElmeRecord(elmeName);

  if (!elmeRecord) {
    return null;
  }

  const electionRows = await getOrderedElectionRows(elmeRecord.id, electionType);
  const resultsByElectionId = await getResultsByElectionIds(
    electionRows.map((row) => row.id),
  );

  const latestRow = electionRows[0] ?? null;
  const previousRow = electionRows[1] ?? null;
  const selectedRow =
    options?.selectedElectionYear != null
      ? electionRows.find((row) => row.electionYear === options.selectedElectionYear) ??
        latestRow
      : latestRow;

  const latest = latestRow
    ? toElectionView(latestRow, resultsByElectionId.get(latestRow.id) ?? [])
    : null;
  const previous = previousRow
    ? toElectionView(previousRow, resultsByElectionId.get(previousRow.id) ?? [])
    : null;
  const selectedElection = selectedRow
    ? toElectionView(selectedRow, resultsByElectionId.get(selectedRow.id) ?? [])
    : null;
  const revisions = selectedRow
    ? await getElectionRevisionViews(selectedRow.id)
    : [];

  const defaults = latest
    ? {
        regionName: elmeRecord.regionName,
        elmeName: elmeRecord.name,
        electionType,
        electionYear: latest.electionYear,
        termYears: latest.termYears,
        electionDate: latest.electionDate,
      }
    : {
        regionName: elmeRecord.regionName,
        elmeName: elmeRecord.name,
        ...DEFAULT_ENTRY_BY_TYPE[electionType],
      };

  const regionName = options?.regionName?.trim() || elmeRecord.regionName;
  const subgroupView = normalizeSubgroupView(regionName, options?.subgroupView);
  const [regionAggregate, nationalAggregate] = await Promise.all([
    getAggregateScopeView(regionName, subgroupView, electionType),
    getAggregateScopeView(null, "all", electionType),
  ]);

  return {
    entryDefaults: defaults,
    editing: {
      availableYears: electionRows.map((row) => row.electionYear),
      selectedElection,
      revisions: revisions.map((revision) => ({
        id: revision.id,
        electionYear: revision.electionYear,
        changedAt: revision.changedAt.toISOString(),
        changeNote: revision.changeNote,
      })),
    },
    presentation: {
      latest,
      previous,
    },
    aggregates: {
      region: regionAggregate,
      national: nationalAggregate,
    },
  };
}

export async function getComparisonCycles(): Promise<ComparisonCyclesState> {
  const [boardCycle, federationCycle, boardHistory, federationHistory] =
    await Promise.all([
    getActiveComparisonCycle("Δ.Σ."),
    getActiveComparisonCycle("ΟΜΟΣΠΟΝΔΙΑ"),
    getComparisonCycleHistory("Δ.Σ."),
    getComparisonCycleHistory("ΟΜΟΣΠΟΝΔΙΑ"),
  ]);

  return {
    cycles: {
      "Δ.Σ.": boardCycle,
      ΟΜΟΣΠΟΝΔΙΑ: federationCycle,
    },
    history: {
      "Δ.Σ.": boardHistory,
      ΟΜΟΣΠΟΝΔΙΑ: federationHistory,
    },
  };
}

export async function saveComparisonCycle(input: SaveComparisonCycleInput) {
  const previousYear = getComparisonCyclePreviousYear(
    input.electionType,
    input.currentYear,
  );

  await db.transaction(async (tx) => {
    await tx
      .update(comparisonCycles)
      .set({
        isActive: false,
        updatedAt: sql`now()`,
      })
      .where(eq(comparisonCycles.electionType, input.electionType));

    await tx
      .insert(comparisonCycles)
      .values({
        electionType: input.electionType,
        currentYear: input.currentYear,
        previousYear,
        isActive: true,
        updatedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: [
          comparisonCycles.electionType,
          comparisonCycles.currentYear,
          comparisonCycles.previousYear,
        ],
        set: {
          isActive: true,
          updatedAt: sql`now()`,
        },
      });
  });

  return getComparisonCycles();
}

export async function saveElection(input: SaveElectionInput) {
  const elmeRecord = await getElmeRecord(input.elmeName);

  if (!elmeRecord) {
    throw new Error("Η ΕΛΜΕ δεν βρέθηκε.");
  }

  const [existingElection] = await db
    .select()
    .from(elections)
    .where(
      and(
        eq(elections.elmeId, elmeRecord.id),
        eq(elections.electionType, input.electionType),
        eq(elections.electionYear, input.electionYear),
      ),
    )
    .limit(1);

  if (existingElection) {
    const existingResultsByElectionId = await getResultsByElectionIds([
      existingElection.id,
    ]);
    const existingSnapshot = buildElectionSnapshot(
      toElectionView(
        existingElection,
        existingResultsByElectionId.get(existingElection.id) ?? [],
      ),
    );

    await db.insert(electionRevisions).values({
      electionId: existingElection.id,
      electionYear: existingElection.electionYear,
      changeNote:
        input.changeNote?.trim() || "Χειροκίνητη επεξεργασία αναμέτρησης",
      snapshotJson: existingSnapshot,
    });
  }

  const [upsertedElection] = await db
    .insert(elections)
    .values({
      elmeId: elmeRecord.id,
      electionYear: input.electionYear,
      electionType: input.electionType,
      termYears: input.termYears,
      electionDate: input.electionDate,
      isLatest: false,
      registeredVoters: input.registeredVoters,
      voted: input.voted,
      invalidBlank: input.invalidBlank,
      valid: input.valid,
      candidatesTotal: input.candidatesTotal,
      substitutesTotal: input.substitutesTotal,
      newlyAppointedTotal: input.newlyAppointedTotal,
      notes: input.notes,
      updatedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: [elections.elmeId, elections.electionYear, elections.electionType],
      set: {
        termYears: input.termYears,
        electionDate: input.electionDate,
        registeredVoters: input.registeredVoters,
        voted: input.voted,
        invalidBlank: input.invalidBlank,
        valid: input.valid,
        candidatesTotal: input.candidatesTotal,
        substitutesTotal: input.substitutesTotal,
        newlyAppointedTotal: input.newlyAppointedTotal,
        notes: input.notes,
        updatedAt: sql`now()`,
      },
    })
    .returning({
      id: elections.id,
    });

  await db
    .delete(electionResults)
    .where(eq(electionResults.electionId, upsertedElection.id));

  for (const result of input.results) {
    const canonicalName = result.canonicalName.trim() || result.rawLabel.trim();

    if (!canonicalName) {
      continue;
    }

    const slateId = await ensureSlate(canonicalName);

    await db.insert(electionResults).values({
      electionId: upsertedElection.id,
      slateId,
      rawLabel: result.rawLabel.trim() || canonicalName,
      votes: result.votes,
      seats: result.seats,
      percentage: input.valid > 0 ? result.votes / input.valid : 0,
      notes: "saved_from_manual_entry",
    });
  }

  return getElectionContext(input.elmeName, input.electionType, {
    selectedElectionYear: input.electionYear,
  });
}
