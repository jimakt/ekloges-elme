CREATE TABLE "election_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL,
	"slate_id" integer NOT NULL,
	"raw_label" text DEFAULT '' NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"seats" integer DEFAULT 0 NOT NULL,
	"percentage" double precision DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "elections" (
	"id" serial PRIMARY KEY NOT NULL,
	"elme_id" integer NOT NULL,
	"label" text NOT NULL,
	"election_type" text DEFAULT 'ΔΣ' NOT NULL,
	"term_years" integer DEFAULT 1 NOT NULL,
	"election_date" date,
	"board_from_year" integer,
	"board_to_year" integer,
	"is_latest" boolean DEFAULT false NOT NULL,
	"registered_voters" integer DEFAULT 0 NOT NULL,
	"voted" integer DEFAULT 0 NOT NULL,
	"invalid_blank" integer DEFAULT 0 NOT NULL,
	"valid" integer DEFAULT 0 NOT NULL,
	"candidates_total" integer DEFAULT 0 NOT NULL,
	"substitutes_total" integer DEFAULT 0 NOT NULL,
	"newly_appointed_total" integer DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "elme" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_id" integer NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"sort_order" integer NOT NULL,
	"is_thessaloniki_subgroup" boolean DEFAULT false NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slate_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"slate_id" integer NOT NULL,
	"alias" text NOT NULL,
	"alias_type" text DEFAULT 'display' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slates" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"display_order" integer NOT NULL,
	"is_core" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_slate_id_slates_id_fk" FOREIGN KEY ("slate_id") REFERENCES "public"."slates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elections" ADD CONSTRAINT "elections_elme_id_elme_id_fk" FOREIGN KEY ("elme_id") REFERENCES "public"."elme"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elme" ADD CONSTRAINT "elme_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slate_aliases" ADD CONSTRAINT "slate_aliases_slate_id_slates_id_fk" FOREIGN KEY ("slate_id") REFERENCES "public"."slates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "election_results_election_slate_idx" ON "election_results" USING btree ("election_id","slate_id");--> statement-breakpoint
CREATE INDEX "election_results_election_idx" ON "election_results" USING btree ("election_id");--> statement-breakpoint
CREATE UNIQUE INDEX "elections_elme_label_type_idx" ON "elections" USING btree ("elme_id","label","election_type");--> statement-breakpoint
CREATE UNIQUE INDEX "elections_latest_per_elme_idx" ON "elections" USING btree ("elme_id") WHERE "elections"."is_latest" = true;--> statement-breakpoint
CREATE INDEX "elections_elme_idx" ON "elections" USING btree ("elme_id");--> statement-breakpoint
CREATE UNIQUE INDEX "elme_name_idx" ON "elme" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "elme_region_sort_idx" ON "elme" USING btree ("region_id","sort_order");--> statement-breakpoint
CREATE INDEX "elme_region_idx" ON "elme" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "elme_thessaloniki_subgroup_idx" ON "elme" USING btree ("is_thessaloniki_subgroup");--> statement-breakpoint
CREATE UNIQUE INDEX "regions_name_idx" ON "regions" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "regions_sort_order_idx" ON "regions" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "slate_aliases_alias_idx" ON "slate_aliases" USING btree ("alias");--> statement-breakpoint
CREATE UNIQUE INDEX "slate_aliases_slate_alias_type_idx" ON "slate_aliases" USING btree ("slate_id","alias","alias_type");--> statement-breakpoint
CREATE UNIQUE INDEX "slates_code_idx" ON "slates" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "slates_name_idx" ON "slates" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "slates_display_order_idx" ON "slates" USING btree ("display_order");