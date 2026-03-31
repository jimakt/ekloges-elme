ALTER TABLE "elections" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE "election_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL,
	"election_year" integer NOT NULL,
	"change_note" text DEFAULT '' NOT NULL,
	"snapshot_json" jsonb NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "election_revisions" ADD CONSTRAINT "election_revisions_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "election_revisions_election_changed_at_idx" ON "election_revisions" USING btree ("election_id","changed_at");
