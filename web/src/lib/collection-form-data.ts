export type ElmeOption = {
  name: string;
  isThessalonikiSubgroup?: boolean;
};

export type RegionOption = {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  mapPaths: string[];
  elmes: ElmeOption[];
};

export const regionOptions: RegionOption[] = [
  {
    id: "amth",
    name: "Ανατολική Μακεδονία - Θράκη",
    shortLabel: "ΑΜΘ",
    description: "6 ΕΛΜΕ",
    mapPaths: [
      "M430 70 L570 78 L610 130 L555 180 L430 172 L395 122 Z",
    ],
    elmes: [
      { name: "Α' ΕΒΡΟΥ" },
      { name: "Β' ΕΒΡΟΥ" },
      { name: "ΡΟΔΟΠΗΣ" },
      { name: "ΞΑΝΘΗΣ" },
      { name: "ΚΑΒΑΛΑΣ" },
      { name: "ΔΡΑΜΑΣ" },
    ],
  },
  {
    id: "kentriki-makedonia",
    name: "Κεντρική Μακεδονία",
    shortLabel: "Κ.Μ.",
    description: "12 ΕΛΜΕ",
    mapPaths: [
      "M300 85 L420 85 L435 175 L335 210 L270 155 Z",
    ],
    elmes: [
      { name: "ΣΕΡΡΩΝ" },
      { name: "ΚΙΛΚΙΣ" },
      { name: "Α' ΘΕΣ/ΝΙΚΗΣ", isThessalonikiSubgroup: true },
      { name: "Β' ΘΕΣ/ΝΙΚΗΣ", isThessalonikiSubgroup: true },
      { name: "Γ' ΘΕΣ/ΝΙΚΗΣ", isThessalonikiSubgroup: true },
      { name: "Δ' ΘΕΣ/ΝΙΚΗΣ", isThessalonikiSubgroup: true },
      { name: "Ε' ΘΕΣ/ΝΙΚΗΣ", isThessalonikiSubgroup: true },
      { name: "ΧΑΛΚΙΔΙΚΗΣ" },
      { name: "Α' ΠΕΛΛΑΣ" },
      { name: "Β' ΠΕΛΛΑΣ" },
      { name: "ΗΜΑΘΙΑΣ" },
      { name: "ΠΙΕΡΙΑΣ" },
    ],
  },
  {
    id: "dytiki-makedonia",
    name: "Δυτική Μακεδονία",
    shortLabel: "Δ.Μ.",
    description: "5 ΕΛΜΕ",
    mapPaths: [
      "M210 95 L300 88 L270 156 L210 190 L155 145 Z",
    ],
    elmes: [
      { name: "ΦΛΩΡΙΝΑΣ" },
      { name: "ΕΟΡΔΑΙΑΣ" },
      { name: "ΚΟΖΑΝΗΣ" },
      { name: "ΚΑΣΤΟΡΙΑΣ" },
      { name: "ΓΡΕΒΕΝΩΝ" },
    ],
  },
  {
    id: "ipeiros-ionia",
    name: "Ήπειρος - Κέρκυρα - Λευκάδα",
    shortLabel: "ΗΠ.",
    description: "6 ΕΛΜΕ",
    mapPaths: [
      "M135 205 L205 188 L232 276 L185 360 L115 320 L108 250 Z",
    ],
    elmes: [
      { name: "ΘΕΣΠΡΩΤΙΑΣ" },
      { name: "ΙΩΑΝΝΙΝΩΝ" },
      { name: "ΠΡΕΒΕΖΑΣ" },
      { name: "ΑΡΤΑΣ" },
      { name: "ΚΕΡΚΥΡΑΣ" },
      { name: "ΛΕΥΚΑΔΑΣ" },
    ],
  },
  {
    id: "thessalia",
    name: "Θεσσαλία",
    shortLabel: "ΘΕΣ.",
    description: "4 ΕΛΜΕ",
    mapPaths: [
      "M250 220 L345 210 L405 250 L382 342 L290 365 L225 312 Z",
    ],
    elmes: [
      { name: "ΤΡΙΚΑΛΩΝ" },
      { name: "ΚΑΡΔΙΤΣΑΣ" },
      { name: "ΛΑΡΙΣΑΣ" },
      { name: "ΜΑΓΝΗΣΙΑΣ" },
    ],
  },
  {
    id: "sterea",
    name: "Στερεά Ελλάδα - Εύβοια",
    shortLabel: "ΣΤ.Ε.",
    description: "5 ΕΛΜΕ",
    mapPaths: [
      "M245 375 L352 348 L448 392 L470 470 L386 532 L268 500 L220 430 Z",
      "M474 384 L520 392 L538 475 L502 548 L466 524 L456 430 Z",
    ],
    elmes: [
      { name: "ΦΘΙΩΤΙΔΑΣ" },
      { name: "ΕΥΡΥΤΑΝΙΑΣ" },
      { name: "ΦΩΚΙΔΑΣ" },
      { name: "ΒΟΙΩΤΙΑΣ" },
      { name: "ΕΥΒΟΙΑΣ" },
    ],
  },
  {
    id: "dytiki-ellada",
    name: "Δυτική Ελλάδα - Ζάκυνθος - Κεφαλονιά - Ιθάκη",
    shortLabel: "Δ.Ε.",
    description: "7 ΕΛΜΕ",
    mapPaths: [
      "M138 378 L233 372 L254 498 L184 578 L105 520 L97 432 Z",
    ],
    elmes: [
      { name: "Α' ΑΙΤ/ΝΑΝΙΑΣ - ΜΕΣΟΛΟΓΓΙΟΥ" },
      { name: "Β' ΑΙΤ/ΝΙΑΣ - ΑΓΡΙΝΙΟΥ" },
      { name: "Α' ΑΧΑΪΑΣ" },
      { name: "Β' ΑΧΑΪΑΣ" },
      { name: "ΗΛΕΙΑΣ" },
      { name: "ΖΑΚΥΝΘΟΥ" },
      { name: "ΚΕΦΑΛΟΝΙΑΣ - ΙΘΑΚΗΣ" },
    ],
  },
  {
    id: "peloponnisos",
    name: "Πελοπόννησος",
    shortLabel: "ΠΕΛ.",
    description: "7 ΕΛΜΕ",
    mapPaths: [
      "M128 592 L245 525 L322 620 L285 758 L165 792 L88 695 Z",
    ],
    elmes: [
      { name: "Α΄ ΚΟΡΙΝΘΙΑΣ" },
      { name: "Β΄ ΚΟΡΙΝΘΙΑΣ" },
      { name: "ΑΡΚΑΔΙΑΣ" },
      { name: "ΑΡΓΟΛΙΔΑΣ" },
      { name: "Α΄ ΜΕΣΣΗΝΙΑΣ" },
      { name: "Β΄ ΜΕΣΣΗΝΙΑΣ" },
      { name: "ΛΑΚΩΝΙΑΣ" },
    ],
  },
  {
    id: "attiki",
    name: "Αττική",
    shortLabel: "ΑΤΤ.",
    description: "20 ΕΛΜΕ",
    mapPaths: [
      "M408 538 L473 498 L549 535 L557 620 L487 668 L421 628 Z",
    ],
    elmes: [
      { name: "Α' ΑΘΗΝΑΣ" },
      { name: "Β' ΑΘΗΝΑΣ" },
      { name: "Γ' ΑΘΗΝΑΣ" },
      { name: "Ε' ΑΘΗΝΑΣ" },
      { name: "ΣΤ' ΑΘΗΝΑΣ" },
      { name: "Ζ' ΑΘΗΝΑΣ" },
      { name: "Α'-Γ' ΑΝΑΤΟΛΙΚΗΣ ΑΤΤΙΚΗΣ" },
      { name: "Β' ΑΝΑΤΟΛΙΚΗΣ ΑΤΤΙΚΗΣ" },
      { name: "Δ' ΑΝΑΤΟΛΙΚΗΣ ΑΤΤΙΚΗΣ" },
      { name: "Ε' ΑΝΑΤΟΛΙΚΗΣ ΑΤΤΙΚΗΣ" },
      { name: "Α' ΔΥΤΙΚΗΣ ΑΤΤΙΚΗΣ" },
      { name: "Β' ΔΥΤΙΚΗΣ ΑΤΤΙΚΗΣ" },
      { name: "Γ' ΔΥΤΙΚΗΣ ΑΤΤΙΚΗΣ" },
      { name: "Α.ΛΙΟΣΙΩΝ - ΖΕΦΥΡΙΟΥ - ΦΥΛΗΣ" },
      { name: "ΕΛΕΥΣΙΝΑΣ" },
      { name: "ΣΙΒΙΤΑΝΙΔΕΙΟΥ" },
      { name: "Α' ΠΕΙΡΑΙΑ" },
      { name: "Β' ΠΕΙΡΑΙΑ" },
      { name: "ΝΟΤΙΑΣ ΑΘΗΝΑΣ" },
      { name: "Ν. ΣΜΥΡΝΗΣ - ΚΑΛΛΙΘΕΑΣ" },
    ],
  },
  {
    id: "aigaio",
    name: "Αιγαίο",
    shortLabel: "ΑΙΓ.",
    description: "11 ΕΛΜΕ",
    mapPaths: [
      "M565 250 L598 230 L621 253 L600 282 L570 275 Z",
      "M594 315 L626 292 L651 320 L630 352 L597 341 Z",
      "M620 390 L648 370 L676 399 L650 432 L620 420 Z",
      "M576 456 L603 438 L628 463 L605 492 L576 481 Z",
      "M540 520 L572 503 L596 530 L575 560 L541 548 Z",
    ],
    elmes: [
      { name: "ΛΕΣΒΟΥ" },
      { name: "ΛΗΜΝΟΥ" },
      { name: "ΧΙΟΥ" },
      { name: "ΣΑΜΟΥ" },
      { name: "ΙΚΑΡΙΑΣ" },
      { name: "Α' ΔΩΔΕΚΑΝΗΣΟΥ" },
      { name: "Β' ΔΩΔΕΚΑΝΗΣΟΥ" },
      { name: "Α' ΚΥΚΛΑΔΩΝ - ΣΥΡΟΥ" },
      { name: "ΘΗΡΑΣ" },
      { name: "ΠΑΡΟΥ - ΑΝΤΙΠΑΡΟΥ" },
      { name: "Β' ΚΥΚΛΑΔΩΝ - ΝΑΞΟΥ" },
    ],
  },
  {
    id: "kriti",
    name: "Κρήτη",
    shortLabel: "ΚΡΗΤΗ",
    description: "4 ΕΛΜΕ",
    mapPaths: [
      "M265 815 L437 805 L505 833 L438 866 L286 864 L222 838 Z",
    ],
    elmes: [
      { name: "ΧΑΝΙΩΝ" },
      { name: "ΡΕΘΥΜΝΟΥ" },
      { name: "ΗΡΑΚΛΕΙΟΥ" },
      { name: "ΛΑΣΙΘΙΟΥ" },
    ],
  },
];

export const baseSlateOptions = [
  "ΑΣΕ",
  "ΔΑΚΕ",
  "ΠΕΚ",
  "ΣΥΝΕΚ",
  "ΠΑΡΕΜΒΑΣΕΙΣ (ΑΝΤΑΡΣ.)",
  "ΜΕΤΑ",
  "Αγ. Κινήσεις",
  "Αγ. Παρέμβαση (ΜΛ)",
  "ΟΛΟΙ ΜΑΖΙ",
  "ΔΙΑΦΟΡΟΙ",
] as const;
