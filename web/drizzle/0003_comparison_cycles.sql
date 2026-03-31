CREATE TABLE "comparison_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_type" text NOT NULL,
	"current_year" integer NOT NULL,
	"previous_year" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "comparison_cycles_active_per_election_type_idx" ON "comparison_cycles" USING btree ("election_type") WHERE "comparison_cycles"."is_active" = true;
--> statement-breakpoint
CREATE UNIQUE INDEX "comparison_cycles_type_years_idx" ON "comparison_cycles" USING btree ("election_type","current_year","previous_year");
--> statement-breakpoint
INSERT INTO "comparison_cycles" ("election_type", "current_year", "previous_year", "is_active")
VALUES
	('Δ.Σ.', 2026, 2024, true),
	('ΟΜΟΣΠΟΝΔΙΑ', 2024, 2022, true);
