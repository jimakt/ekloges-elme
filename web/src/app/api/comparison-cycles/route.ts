import { z } from "zod";
import { NextResponse } from "next/server";

import {
  getComparisonCycles,
  saveComparisonCycle,
} from "@/lib/election-data";

const comparisonCyclePayloadSchema = z.object({
  electionType: z.union([z.literal("Δ.Σ."), z.literal("ΟΜΟΣΠΟΝΔΙΑ")]),
  currentYear: z.coerce.number().int().min(1900).max(2200),
});

export async function GET() {
  try {
    const state = await getComparisonCycles();

    return NextResponse.json(state, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Απέτυχε η φόρτωση των κύκλων σύγκρισης.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = comparisonCyclePayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Μη έγκυρα δεδομένα κύκλου σύγκρισης." },
      { status: 400 },
    );
  }

  try {
    const state = await saveComparisonCycle(parsed.data);

    return NextResponse.json(
      {
        message: "Ο κύκλος σύγκρισης αποθηκεύτηκε.",
        ...state,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Απέτυχε η αποθήκευση του κύκλου σύγκρισης.",
      },
      { status: 500 },
    );
  }
}
