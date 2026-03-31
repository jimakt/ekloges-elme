ALTER TABLE "elections" ADD COLUMN "election_year" integer;
--> statement-breakpoint
UPDATE "elections"
SET "election_year" = COALESCE(
	"board_to_year",
	NULLIF(substring("label" from '([0-9]{4})$'), '')::integer
);
--> statement-breakpoint
ALTER TABLE "elections" ALTER COLUMN "election_year" SET NOT NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS "elections_elme_label_type_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX "elections_elme_year_type_idx" ON "elections" USING btree ("elme_id","election_year","election_type");
--> statement-breakpoint
ALTER TABLE "elections" DROP COLUMN "label";
--> statement-breakpoint
ALTER TABLE "elections" DROP COLUMN "board_from_year";
--> statement-breakpoint
ALTER TABLE "elections" DROP COLUMN "board_to_year";
