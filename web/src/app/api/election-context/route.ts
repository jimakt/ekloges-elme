import { NextResponse } from "next/server";

import {
  getElectionContext,
  type ElectionType,
  type RegionSubgroupView,
} from "@/lib/election-data";

function isElectionType(value: string): value is ElectionType {
  return value === "Δ.Σ." || value === "ΟΜΟΣΠΟΝΔΙΑ";
}

function isRegionSubgroupView(value: string): value is RegionSubgroupView {
  return value === "all" || value === "thessaloniki" || value === "rest";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const elmeName = searchParams.get("elmeName")?.trim() ?? "";
    const electionType = searchParams.get("electionType")?.trim() ?? "";
    const regionName = searchParams.get("regionName")?.trim() ?? "";
    const subgroupView = searchParams.get("subgroupView")?.trim() ?? "all";
    const selectedElectionYearValue =
      searchParams.get("selectedElectionYear")?.trim() ?? "";
    const selectedElectionYear = selectedElectionYearValue
      ? Number.parseInt(selectedElectionYearValue, 10)
      : null;

    if (
      !elmeName ||
      !isElectionType(electionType) ||
      !regionName ||
      !isRegionSubgroupView(subgroupView) ||
      (selectedElectionYearValue && Number.isNaN(selectedElectionYear))
    ) {
      return NextResponse.json(
        { error: "Μη έγκυρα στοιχεία περιοχής, ΕΛΜΕ ή τύπου αναμέτρησης." },
        { status: 400 },
      );
    }

    const context = await getElectionContext(elmeName, electionType, {
      regionName,
      subgroupView,
      selectedElectionYear: selectedElectionYear ?? undefined,
    });

    if (!context) {
      return NextResponse.json(
        { error: "Η ΕΛΜΕ δεν βρέθηκε." },
        { status: 404 },
      );
    }

    return NextResponse.json(context, { status: 200 });
  } catch (error) {
    console.error("Failed to load election context", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Απέτυχε η φόρτωση των αποτελεσμάτων.",
      },
      { status: 500 },
    );
  }
}
