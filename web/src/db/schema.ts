import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const regions = pgTable(
  "regions",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("regions_name_idx").on(table.name),
    sortOrderIdx: uniqueIndex("regions_sort_order_idx").on(table.sortOrder),
  }),
);

export const elme = pgTable(
  "elme",
  {
    id: serial("id").primaryKey(),
    regionId: integer("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    displayName: text("display_name").notNull(),
    sortOrder: integer("sort_order").notNull(),
    isThessalonikiSubgroup: boolean("is_thessaloniki_subgroup")
      .notNull()
      .default(false),
    notes: text("notes").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("elme_name_idx").on(table.name),
    regionSortIdx: uniqueIndex("elme_region_sort_idx").on(
      table.regionId,
      table.sortOrder,
    ),
    regionIdx: index("elme_region_idx").on(table.regionId),
    thessalonikiSubgroupIdx: index("elme_thessaloniki_subgroup_idx").on(
      table.isThessalonikiSubgroup,
    ),
  }),
);

export const elections = pgTable(
  "elections",
  {
    id: serial("id").primaryKey(),
    elmeId: integer("elme_id")
      .notNull()
      .references(() => elme.id, { onDelete: "cascade" }),
    electionYear: integer("election_year").notNull(),
    electionType: text("election_type").notNull().default("ΔΣ"),
    termYears: integer("term_years").notNull().default(1),
    electionDate: date("election_date"),
    isLatest: boolean("is_latest").notNull().default(false),
    registeredVoters: integer("registered_voters").notNull().default(0),
    voted: integer("voted").notNull().default(0),
    invalidBlank: integer("invalid_blank").notNull().default(0),
    valid: integer("valid").notNull().default(0),
    candidatesTotal: integer("candidates_total").notNull().default(0),
    substitutesTotal: integer("substitutes_total").notNull().default(0),
    newlyAppointedTotal: integer("newly_appointed_total").notNull().default(0),
    notes: text("notes").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    elmeYearTypeIdx: uniqueIndex("elections_elme_year_type_idx").on(
      table.elmeId,
      table.electionYear,
      table.electionType,
    ),
    latestPerElmeIdx: uniqueIndex("elections_latest_per_elme_idx")
      .on(table.elmeId)
      .where(sql`${table.isLatest} = true`),
    elmeIdx: index("elections_elme_idx").on(table.elmeId),
  }),
);

export const electionRevisions = pgTable(
  "election_revisions",
  {
    id: serial("id").primaryKey(),
    electionId: integer("election_id")
      .notNull()
      .references(() => elections.id, { onDelete: "cascade" }),
    electionYear: integer("election_year").notNull(),
    changeNote: text("change_note").notNull().default(""),
    snapshotJson: jsonb("snapshot_json").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    electionChangedAtIdx: index("election_revisions_election_changed_at_idx").on(
      table.electionId,
      table.changedAt,
    ),
  }),
);

export const comparisonCycles = pgTable(
  "comparison_cycles",
  {
    id: serial("id").primaryKey(),
    electionType: text("election_type").notNull(),
    currentYear: integer("current_year").notNull(),
    previousYear: integer("previous_year").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    activePerElectionTypeIdx: uniqueIndex(
      "comparison_cycles_active_per_election_type_idx",
    )
      .on(table.electionType)
      .where(sql`${table.isActive} = true`),
    electionTypeYearsIdx: uniqueIndex("comparison_cycles_type_years_idx").on(
      table.electionType,
      table.currentYear,
      table.previousYear,
    ),
  }),
);

export const slates = pgTable(
  "slates",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    displayOrder: integer("display_order").notNull(),
    isCore: boolean("is_core").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("slates_code_idx").on(table.code),
    nameIdx: uniqueIndex("slates_name_idx").on(table.name),
    sortOrderIdx: uniqueIndex("slates_display_order_idx").on(table.displayOrder),
  }),
);

export const slateAliases = pgTable(
  "slate_aliases",
  {
    id: serial("id").primaryKey(),
    slateId: integer("slate_id")
      .notNull()
      .references(() => slates.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    aliasType: text("alias_type").notNull().default("display"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    aliasIdx: uniqueIndex("slate_aliases_alias_idx").on(table.alias),
    slateAliasTypeIdx: uniqueIndex("slate_aliases_slate_alias_type_idx").on(
      table.slateId,
      table.alias,
      table.aliasType,
    ),
  }),
);

export const electionResults = pgTable(
  "election_results",
  {
    id: serial("id").primaryKey(),
    electionId: integer("election_id")
      .notNull()
      .references(() => elections.id, { onDelete: "cascade" }),
    slateId: integer("slate_id")
      .notNull()
      .references(() => slates.id, { onDelete: "restrict" }),
    rawLabel: text("raw_label").notNull().default(""),
    votes: integer("votes").notNull().default(0),
    seats: integer("seats").notNull().default(0),
    percentage: doublePrecision("percentage").notNull().default(0),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    electionSlateIdx: uniqueIndex("election_results_election_slate_idx").on(
      table.electionId,
      table.slateId,
    ),
    electionIdx: index("election_results_election_idx").on(table.electionId),
  }),
);
