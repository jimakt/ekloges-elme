import { z } from "zod";
import { NextResponse } from "next/server";

import { saveElection } from "@/lib/election-data";

const electionTypeSchema = z.union([z.literal("Δ.Σ."), z.literal("ΟΜΟΣΠΟΝΔΙΑ")]);

const integerField = z.coerce.number().int().min(0);
const electionYearField = z.coerce.number().int().min(1900).max(2200);

const nullableDateField = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    return value;
  },
  z.string().nullable(),
);

const electionPayloadSchema = z.object({
  elmeName: z.string().min(1),
  electionType: electionTypeSchema,
  electionYear: electionYearField,
  termYears: z.union([z.literal(1), z.literal(2)]),
  electionDate: nullableDateField,
  registeredVoters: integerField,
  voted: integerField,
  invalidBlank: integerField,
  valid: integerField,
  candidatesTotal: integerField,
  substitutesTotal: integerField,
  newlyAppointedTotal: integerField,
  notes: z.string(),
  changeNote: z.string().nullable().optional(),
  results: z.array(
    z.object({
      canonicalName: z.string(),
      rawLabel: z.string(),
      votes: integerField,
      seats: integerField,
    }),
  ),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = electionPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Μη έγκυρα δεδομένα φόρμας.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const context = await saveElection(parsed.data);
    return NextResponse.json(
      {
        message: "Η αναμέτρηση αποθηκεύτηκε.",
        context,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Απέτυχε η αποθήκευση της αναμέτρησης.",
      },
      { status: 500 },
    );
  }
}
