// What the civic corpus and models are built to understand. Each category is
// paired with a worked example. In every example the model's job stops at
// understanding and structuring what was said.

export type InputMedium = "voice" | "meeting" | "reports" | "text";

export type CivicCategory = {
  id: string;
  label: string;
  /** What the input looks like, drawn as the category's visual. */
  medium: InputMedium;
  /** Optional photograph for the category, served from /public. */
  image?: string;
  input: { kind: string; text: string };
  output: [string, string][];
  boundary: string;
};

export const civicCategories: CivicCategory[] = [
  {
    id: "community-problems",
    label: "Community problems",
    medium: "voice",
    input: {
      kind: "Voice note · Luganda",
      text: "A resident describes a collapsed footbridge on the route to the market.",
    },
    output: [
      ["category", "infrastructure"],
      ["asset", "footbridge"],
      ["status", "collapsed"],
      ["location", "parish-level, from report"],
      ["severity", "high"],
    ],
    boundary: "Transcribes, classifies, and structures the report.",
  },
  {
    id: "public-services",
    label: "Public services",
    medium: "reports",
    input: {
      kind: "Repeated reports · multiple languages",
      text: "Several residents report long waits and too few staff at the same health clinic.",
    },
    output: [
      ["category", "public_services.health"],
      ["signal", "service_gap.staffing"],
      ["reports", "aggregated"],
      ["reporters", "anonymous"],
    ],
    boundary: "Aggregates reports into one signal and keeps reporters anonymous.",
  },
  {
    id: "local-government",
    label: "Local government",
    medium: "meeting",
    input: {
      kind: "Meeting recording · sub-county council",
      text: "A council session conducted in the local language.",
    },
    output: [
      ["decisions", "listed"],
      ["commitments", "listed, with owner"],
      ["summary_language", "language of the meeting"],
    ],
    boundary: "Summarises decisions and commitments as stated.",
  },
  {
    id: "elections",
    label: "Elections",
    medium: "text",
    input: {
      kind: "Community report · Swahili",
      text: "The polling station opened two hours late and the register was missing.",
    },
    output: [
      ["category", "elections.logistics"],
      ["issues", "late_opening, missing_register"],
      ["route_to", "electoral logistics"],
    ],
    boundary: "Routes logistics and candidate conduct to separate channels.",
  },
  {
    id: "accountability",
    label: "Corruption & accountability",
    medium: "voice",
    input: {
      kind: "Voice report",
      text: "A citizen describes being asked for an unofficial payment at a public office.",
    },
    output: [
      ["service", "extracted"],
      ["office", "extracted"],
      ["request_type", "unofficial_payment"],
      ["record", "accountability"],
    ],
    boundary: "Structures the account as a factual record.",
  },
  {
    id: "priorities",
    label: "Community priorities",
    medium: "meeting",
    input: {
      kind: "Village meeting · open feedback",
      text: "“What matters most to us this year.”",
    },
    output: [
      ["themes", "clustered"],
      ["ranking", "by frequency of mention"],
      ["quotes", "representative, anonymised"],
    ],
    boundary: "Clusters into themes. Unstructured audio becomes usable evidence.",
  },
  {
    id: "rights",
    label: "Civic rights",
    medium: "text",
    input: {
      kind: "Community report",
      text: "A resident describes being refused a service on discriminatory grounds.",
    },
    output: [
      ["category", "civic_rights.non_discrimination"],
      ["service", "extracted"],
      ["route_to", "relevant monitoring body"],
    ],
    boundary: "Classifies the report and routes it to the monitoring body.",
  },
  {
    id: "public-meetings",
    label: "Public meetings",
    medium: "meeting",
    input: {
      kind: "Baraza recording",
      text: "A town hall with residents and local officials.",
    },
    output: [
      ["segments", "by speaker turn"],
      ["questions_raised", "listed"],
      ["answers_given", "listed"],
      ["unanswered", "flagged"],
    ],
    boundary: "Separates questions from answers, in the speakers' own words.",
  },
  {
    id: "promises",
    label: "Political promises",
    medium: "voice",
    input: {
      kind: "Campaign recording",
      text: "A recorded pledge to build a road within a stated period.",
    },
    output: [
      ["commitment", "the specific promise"],
      ["date", "recorded"],
      ["location", "recorded"],
      ["trackable", "true"],
    ],
    boundary: "Logs the commitment exactly as stated.",
  },
  {
    id: "development",
    label: "Local development",
    medium: "reports",
    input: {
      kind: "Community reports · over time",
      text: "Residents repeatedly mention the same stalled road project.",
    },
    output: [
      ["project", "matched by location"],
      ["status_as_experienced", "stalled"],
      ["reports", "aggregated over time"],
    ],
    boundary: "Records project status as residents experience it.",
  },
  {
    id: "feedback",
    label: "Citizen feedback",
    medium: "voice",
    input: {
      kind: "Spoken feedback · new public service",
      text: "Free-form comments on how a new service is working.",
    },
    output: [
      ["translation", "to English"],
      ["themes", "categorised"],
      ["sentiment", "per theme"],
      ["destination", "WatchTower evidence"],
    ],
    boundary: "Translates, summarises, and categorises into structured evidence.",
  },
];

// Real Luganda sentences with their professional reference translations from
// the Sunbird SALT corpus (held-out split). Used as worked examples of civic
// speech becoming structured records. The structured fields illustrate the
// target schema and are not model output.
export type WorkedExample = {
  language: string;
  code: string;
  source: string;
  reference: string;
  record: [string, string][];
};

export const workedExamples: WorkedExample[] = [
  {
    language: "Luganda",
    code: "lg",
    source:
      "Olukiiko lwawa ssentebe wa disitulikiti ennaku kkumi okuwaayo kalonda yenna akwata ku abo abaakosebwa amataba.",
    reference:
      "The committee gave the district chairperson ten days to submit the details of those affected by the floods.",
    record: [
      ["category", "local_government"],
      ["topic", "disaster_response.floods"],
      ["actor", "district chairperson"],
      ["commitment", "submit details of affected residents"],
      ["deadline", "10 days"],
    ],
  },
  {
    language: "Luganda",
    code: "lg",
    source: "Gavumenti erwawo okusasula abasawo mu malwaliro gaayo.",
    reference: "The government takes long to pay doctors in public hospitals.",
    record: [
      ["category", "public_services.health"],
      ["issue", "delayed_salary_payment"],
      ["institution", "public hospitals"],
      ["affected", "doctors"],
    ],
  },
  {
    language: "Luganda",
    code: "lg",
    source: "Emiruka ena mu Arua gijja kwetaba mu pulojekiti.",
    reference: "Four sub-counties in Arua will participate in the project.",
    record: [
      ["category", "local_development"],
      ["location", "Arua"],
      ["admin_units", "4 sub-counties"],
      ["status", "announced"],
    ],
  },
];

// The civic terminology layer: expression → English → civic concept → context.
// Expressions and English renderings are taken from professionally
// translated sentence pairs in the Sunbird SALT corpus (held-out split).
export type TermMapping = {
  expression: string;
  language: string;
  english: string;
  concept: string;
  sentence: string;
  reference: string;
  context: string;
};

export const terminology: TermMapping[] = [
  {
    expression: "Olukiiko",
    language: "Luganda",
    english: "committee · council",
    concept: "local_government.body",
    sentence:
      "Olukiiko lwawa ssentebe wa disitulikiti ennaku kkumi okuwaayo kalonda yenna akwata ku abo abaakosebwa amataba.",
    reference:
      "The committee gave the district chairperson ten days to submit the details of those affected by the floods.",
    context:
      "A deliberative body. The same word covers a committee, a council, or an assembly; the surrounding speech decides which one is meant.",
  },
  {
    expression: "ssentebe wa disitulikiti",
    language: "Luganda",
    english: "district chairperson",
    concept: "local_government.office",
    sentence:
      "Olukiiko lwawa ssentebe wa disitulikiti ennaku kkumi okuwaayo kalonda yenna akwata ku abo abaakosebwa amataba.",
    reference:
      "The committee gave the district chairperson ten days to submit the details of those affected by the floods.",
    context:
      "An elected office, referred to by role. Structured as an office so reports stay about institutions.",
  },
  {
    expression: "Emiruka",
    language: "Luganda",
    english: "sub-counties (in this reference)",
    concept: "local_government.admin_unit",
    sentence: "Emiruka ena mu Arua gijja kwetaba mu pulojekiti.",
    reference: "Four sub-counties in Arua will participate in the project.",
    context:
      "Administrative terms shift with region and register: omuluka commonly means parish in Buganda's hierarchy, and this reference renders it as sub-county. The layer records each mapping with its context.",
  },
  {
    expression: "Embalirira",
    language: "Luganda",
    english: "budget",
    concept: "public_finance.budget",
    sentence: "Embalirira teyali nnambulukufu kimala gye tuli.",
    reference: "The budget was not clear enough for us.",
    context:
      "Used for household and public budgets alike. Here, a statement about transparency, structured as a concern about public finance.",
  },
  {
    expression: "Okulonda",
    language: "Luganda",
    english: "elections · voting",
    concept: "elections.process",
    sentence: "Okulonda kwongezeddwayo.",
    reference: "The elections have been postponed.",
    context:
      "The act of choosing, extended to elections. Classified as election logistics, kept separate from anything about candidates.",
  },
  {
    expression: "Kakuyege",
    language: "Luganda",
    english: "campaign",
    concept: "elections.campaign",
    sentence: "Kakuyege atongozeddwa leero.",
    reference: "The campaigns were launched today.",
    context:
      "A mobilisation drive, used for political, health, and development campaigns alike. Context decides the category.",
  },
  {
    expression: "Gavumenti … abasawo … amalwaliro",
    language: "Luganda",
    english: "government · doctors · hospitals",
    concept: "public_services.health",
    sentence: "Gavumenti erwawo okusasula abasawo mu malwaliro gaayo.",
    reference: "The government takes long to pay doctors in public hospitals.",
    context:
      "A service-delivery complaint expressed through three terms. Structured as a health-service issue with the institution as its subject.",
  },
];
