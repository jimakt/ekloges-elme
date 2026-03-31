import { spawnSync } from "node:child_process";

const regions = [
  { sortOrder: 1, name: "Ανατολική Μακεδονία - Θράκη" },
  { sortOrder: 2, name: "Κεντρική Μακεδονία" },
  { sortOrder: 3, name: "Δυτική Μακεδονία" },
  { sortOrder: 4, name: "Ήπειρος - Κέρκυρα - Λευκάδα" },
  { sortOrder: 5, name: "Θεσσαλία" },
  { sortOrder: 6, name: "Στερεά Ελλάδα - Εύβοια" },
  { sortOrder: 7, name: "Δυτική Ελλάδα - Ζάκυνθος - Κεφαλονιά - Ιθάκη" },
  { sortOrder: 8, name: "Πελοπόννησος" },
  { sortOrder: 9, name: "Αιγαίο" },
  { sortOrder: 10, name: "Κρήτη" },
  { sortOrder: 11, name: "Αττική" },
];

const elmes = [
  ["Ανατολική Μακεδονία - Θράκη", 1, "Α' ΕΒΡΟΥ"],
  ["Ανατολική Μακεδονία - Θράκη", 2, "Β' ΕΒΡΟΥ"],
  ["Ανατολική Μακεδονία - Θράκη", 3, "ΡΟΔΟΠΗΣ"],
  ["Ανατολική Μακεδονία - Θράκη", 4, "ΞΑΝΘΗΣ"],
  ["Ανατολική Μακεδονία - Θράκη", 5, "ΚΑΒΑΛΑΣ"],
  ["Ανατολική Μακεδονία - Θράκη", 6, "ΔΡΑΜΑΣ"],
  ["Κεντρική Μακεδονία", 1, "ΣΕΡΡΩΝ"],
  ["Κεντρική Μακεδονία", 2, "ΚΙΛΚΙΣ"],
  ["Κεντρική Μακεδονία", 3, "Α' ΘΕΣ/ΝΙΚΗΣ", true],
  ["Κεντρική Μακεδονία", 4, "Β' ΘΕΣ/ΝΙΚΗΣ", true],
  ["Κεντρική Μακεδονία", 5, "Γ' ΘΕΣ/ΝΙΚΗΣ", true],
  ["Κεντρική Μακεδονία", 6, "Δ' ΘΕΣ/ΝΙΚΗΣ", true],
  ["Κεντρική Μακεδονία", 7, "Ε' ΘΕΣ/ΝΙΚΗΣ", true],
  ["Κεντρική Μακεδονία", 8, "ΧΑΛΚΙΔΙΚΗΣ"],
  ["Κεντρική Μακεδονία", 9, "Α' ΠΕΛΛΑΣ"],
  ["Κεντρική Μακεδονία", 10, "Β' ΠΕΛΛΑΣ"],
  ["Κεντρική Μακεδονία", 11, "ΗΜΑΘΙΑΣ"],
  ["Κεντρική Μακεδονία", 12, "ΠΙΕΡΙΑΣ"],
  ["Δυτική Μακεδονία", 1, "ΦΛΩΡΙΝΑΣ"],
  ["Δυτική Μακεδονία", 2, "ΕΟΡΔΑΙΑΣ"],
  ["Δυτική Μακεδονία", 3, "ΚΟΖΑΝΗΣ"],
  ["Δυτική Μακεδονία", 4, "ΚΑΣΤΟΡΙΑΣ"],
  ["Δυτική Μακεδονία", 5, "ΓΡΕΒΕΝΩΝ"],
  ["Ήπειρος - Κέρκυρα - Λευκάδα", 1, "ΘΕΣΠΡΩΤΙΑΣ"],
  ["Ήπειρος - Κέρκυρα - Λευκάδα", 2, "ΙΩΑΝΝΙΝΩΝ"],
  ["Ήπειρος - Κέρκυρα - Λευκάδα", 3, "ΠΡΕΒΕΖΑΣ"],
  ["Ήπειρος - Κέρκυρα - Λευκάδα", 4, "ΑΡΤΑΣ"],
  ["Ήπειρος - Κέρκυρα - Λευκάδα", 5, "ΚΕΡΚΥΡΑΣ"],
  ["Ήπειρος - Κέρκυρα - Λευκάδα", 6, "ΛΕΥΚΑΔΑΣ"],
  ["Θεσσαλία", 1, "ΤΡΙΚΑΛΩΝ"],
  ["Θεσσαλία", 2, "ΚΑΡΔΙΤΣΑΣ"],
  ["Θεσσαλία", 3, "ΛΑΡΙΣΑΣ"],
  ["Θεσσαλία", 4, "ΜΑΓΝΗΣΙΑΣ"],
  ["Στερεά Ελλάδα - Εύβοια", 1, "ΦΘΙΩΤΙΔΑΣ"],
  ["Στερεά Ελλάδα - Εύβοια", 2, "ΕΥΡΥΤΑΝΙΑΣ"],
  ["Στερεά Ελλάδα - Εύβοια", 3, "ΦΩΚΙΔΑΣ"],
  ["Στερεά Ελλάδα - Εύβοια", 4, "ΒΟΙΩΤΙΑΣ"],
  ["Στερεά Ελλάδα - Εύβοια", 5, "ΕΥΒΟΙΑΣ"],
  ["Δυτική Ελλάδα - Ζάκυνθος - Κεφαλονιά - Ιθάκη", 1, "Α' ΑΙΤ/ΝΑΝΙΑΣ - ΜΕΣΟΛΟΓΓΙΟΥ"],
  ["Δυτική Ελλάδα - Ζάκυνθος - Κεφαλονιά - Ιθάκη", 2, "Β' ΑΙΤ/ΝΙΑΣ - ΑΓΡΙΝΙΟΥ"],
  ["Δυτική Ελλάδα - Ζάκυνθος - Κεφαλονιά - Ιθάκη", 3, "Α' ΑΧΑΪΑΣ"],
  ["Δυτική Ελλάδα - Ζάκυνθος - Κεφαλονιά - Ιθάκη", 4, "Β' ΑΧΑΪΑΣ"],
  ["Δυτική Ελλάδα - Ζάκυνθος - Κεφαλονιά - Ιθάκη", 5, "ΗΛΕΙΑΣ"],
  ["Δυτική Ελλάδα - Ζάκυνθος - Κεφαλονιά - Ιθάκη", 6, "ΖΑΚΥΝΘΟΥ"],
  ["Δυτική Ελλάδα - Ζάκυνθος - Κεφαλονιά - Ιθάκη", 7, "ΚΕΦΑΛΟΝΙΑΣ - ΙΘΑΚΗΣ"],
  ["Πελοπόννησος", 1, "Α΄ ΚΟΡΙΝΘΙΑΣ"],
  ["Πελοπόννησος", 2, "Β΄ ΚΟΡΙΝΘΙΑΣ"],
  ["Πελοπόννησος", 3, "ΑΡΚΑΔΙΑΣ"],
  ["Πελοπόννησος", 4, "ΑΡΓΟΛΙΔΑΣ"],
  ["Πελοπόννησος", 5, "Α΄ ΜΕΣΣΗΝΙΑΣ"],
  ["Πελοπόννησος", 6, "Β΄ ΜΕΣΣΗΝΙΑΣ"],
  ["Πελοπόννησος", 7, "ΛΑΚΩΝΙΑΣ"],
  ["Αιγαίο", 1, "ΛΕΣΒΟΥ"],
  ["Αιγαίο", 2, "ΛΗΜΝΟΥ"],
  ["Αιγαίο", 3, "ΧΙΟΥ"],
  ["Αιγαίο", 4, "ΣΑΜΟΥ"],
  ["Αιγαίο", 5, "ΙΚΑΡΙΑΣ"],
  ["Αιγαίο", 6, "Α' ΔΩΔΕΚΑΝΗΣΟΥ"],
  ["Αιγαίο", 7, "Β' ΔΩΔΕΚΑΝΗΣΟΥ"],
  ["Αιγαίο", 8, "Α' ΚΥΚΛΑΔΩΝ - ΣΥΡΟΥ"],
  ["Αιγαίο", 9, "ΘΗΡΑΣ"],
  ["Αιγαίο", 10, "ΠΑΡΟΥ - ΑΝΤΙΠΑΡΟΥ"],
  ["Αιγαίο", 11, "Β' ΚΥΚΛΑΔΩΝ - ΝΑΞΟΥ"],
  ["Κρήτη", 1, "ΧΑΝΙΩΝ"],
  ["Κρήτη", 2, "ΡΕΘΥΜΝΟΥ"],
  ["Κρήτη", 3, "ΗΡΑΚΛΕΙΟΥ"],
  ["Κρήτη", 4, "ΛΑΣΙΘΙΟΥ"],
  ["Αττική", 1, "Α' ΑΘΗΝΑΣ"],
  ["Αττική", 2, "Β' ΑΘΗΝΑΣ"],
  ["Αττική", 3, "Γ' ΑΘΗΝΑΣ"],
  ["Αττική", 4, "Ε' ΑΘΗΝΑΣ"],
  ["Αττική", 5, "ΣΤ' ΑΘΗΝΑΣ"],
  ["Αττική", 6, "Ζ' ΑΘΗΝΑΣ"],
  ["Αττική", 7, "Α'-Γ' ΑΝΑΤΟΛΙΚΗΣ ΑΤΤΙΚΗΣ"],
  ["Αττική", 8, "Β' ΑΝΑΤΟΛΙΚΗΣ ΑΤΤΙΚΗΣ"],
  ["Αττική", 9, "Δ' ΑΝΑΤΟΛΙΚΗΣ ΑΤΤΙΚΗΣ"],
  ["Αττική", 10, "Ε' ΑΝΑΤΟΛΙΚΗΣ ΑΤΤΙΚΗΣ"],
  ["Αττική", 11, "Α' ΔΥΤΙΚΗΣ ΑΤΤΙΚΗΣ"],
  ["Αττική", 12, "Β' ΔΥΤΙΚΗΣ ΑΤΤΙΚΗΣ"],
  ["Αττική", 13, "Γ' ΔΥΤΙΚΗΣ ΑΤΤΙΚΗΣ"],
  ["Αττική", 14, "Α.ΛΙΟΣΙΩΝ - ΖΕΦΥΡΙΟΥ - ΦΥΛΗΣ"],
  ["Αττική", 15, "ΕΛΕΥΣΙΝΑΣ"],
  ["Αττική", 16, "ΣΙΒΙΤΑΝΙΔΕΙΟΥ"],
  ["Αττική", 17, "Α' ΠΕΙΡΑΙΑ"],
  ["Αττική", 18, "Β' ΠΕΙΡΑΙΑ"],
  ["Αττική", 19, "ΝΟΤΙΑΣ ΑΘΗΝΑΣ"],
  ["Αττική", 20, "Ν. ΣΜΥΡΝΗΣ - ΚΑΛΛΙΘΕΑΣ"],
];

const slates = [
  { code: "ASE", name: "ΑΣΕ", displayOrder: 1 },
  { code: "DAKE", name: "ΔΑΚΕ", displayOrder: 2 },
  { code: "PEK", name: "ΠΕΚ", displayOrder: 3 },
  { code: "SYNEK", name: "ΣΥΝΕΚ", displayOrder: 4 },
  {
    code: "PAREMVASEIS_ANTARS",
    name: "ΠΑΡΕΜΒΑΣΕΙΣ (ΑΝΤΑΡΣ.)",
    displayOrder: 5,
  },
  { code: "META", name: "ΜΕΤΑ", displayOrder: 6 },
  { code: "AG_KINISEIS", name: "Αγ. Κινήσεις", displayOrder: 7 },
  {
    code: "AG_PAREMVASI_ML",
    name: "Αγ. Παρέμβαση (ΜΛ)",
    displayOrder: 8,
  },
  { code: "OLOI_MAZI", name: "ΟΛΟΙ ΜΑΖΙ", displayOrder: 9 },
  { code: "DIAFOROI", name: "ΔΙΑΦΟΡΟΙ", displayOrder: 10 },
];

const slateAliases = [
  { slateCode: "PAREMVASEIS_ANTARS", alias: "ΠΑΡΕΜΒΑΣΕΙΣ" },
  { slateCode: "OLOI_MAZI", alias: "ΜΑΖΙ" },
  { slateCode: "OLOI_MAZI", alias: "MAZI" },
];

function escapeSql(value) {
  return value.replaceAll("'", "''");
}

function sqlString(value) {
  return `'${escapeSql(value)}'`;
}

function sqlBoolean(value) {
  return value ? "true" : "false";
}

const statements = [];

statements.push("begin;");

for (const region of regions) {
  statements.push(`
    insert into regions (name, sort_order)
    values (${sqlString(region.name)}, ${region.sortOrder})
    on conflict (name)
    do update set sort_order = excluded.sort_order;
  `);
}

for (const [regionName, sortOrder, name, isThessalonikiSubgroup = false] of elmes) {
  statements.push(`
    insert into elme (
      region_id,
      name,
      display_name,
      sort_order,
      is_thessaloniki_subgroup
    )
    values (
      (select id from regions where name = ${sqlString(regionName)}),
      ${sqlString(name)},
      ${sqlString(name)},
      ${sortOrder},
      ${sqlBoolean(isThessalonikiSubgroup)}
    )
    on conflict (name)
    do update set
      region_id = excluded.region_id,
      display_name = excluded.display_name,
      sort_order = excluded.sort_order,
      is_thessaloniki_subgroup = excluded.is_thessaloniki_subgroup;
  `);
}

for (const slate of slates) {
  statements.push(`
    insert into slates (code, name, display_order)
    values (
      ${sqlString(slate.code)},
      ${sqlString(slate.name)},
      ${slate.displayOrder}
    )
    on conflict (code)
    do update set
      name = excluded.name,
      display_order = excluded.display_order;
  `);
}

for (const alias of slateAliases) {
  statements.push(`
    insert into slate_aliases (slate_id, alias, alias_type)
    values (
      (select id from slates where code = ${sqlString(alias.slateCode)}),
      ${sqlString(alias.alias)},
      'legacy'
    )
    on conflict (alias)
    do update set
      slate_id = excluded.slate_id,
      alias_type = excluded.alias_type;
  `);
}

statements.push("commit;");

const sqlPayload = statements.join("\n");

const result = spawnSync(
  "docker",
  [
    "exec",
    "-i",
    "ekloges-elme-db",
    "psql",
    "-v",
    "ON_ERROR_STOP=1",
    "-U",
    "postgres",
    "-d",
    "ekloges_elme",
  ],
  {
    input: sqlPayload,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr || "Seeding failed.\n");
  process.exit(result.status ?? 1);
}

process.stdout.write(result.stdout);
process.stdout.write(
  `Seeded ${regions.length} regions, ${elmes.length} ELME entries and ${slates.length} slates.\n`,
);
