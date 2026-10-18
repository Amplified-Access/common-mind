// The site's editorial content as the pages read it from Sanity (queries.ts
// shapes each document to these). Fields an editor may leave empty are null.

export type Link = { label: string; href: string };

/** An image from Sanity's CDN, with its intrinsic size. */
export type SanityImage = { url: string; width: number; height: number };

/** How tall a logo is drawn (LOGO_SIZE_CLASS). */
export type LogoSize = "sm" | "md" | "lg" | "xl";

export type DatasetKind =
  | "Parallel"
  | "Instruction"
  | "Question Answering"
  | "Monolingual"
  | "Evaluation";

export type Dataset = {
  slug: string;
  name: string;
  kind: DatasetKind;
  /** Languages the dataset contributes, besides English. */
  languages: string[];
  /** Subject areas, where the source describes them. */
  domains: string[] | null;
  source: string;
  href: string;
  description: string;
  /** How much of it the models used, as reported in the technical reports. */
  used: string | null;
  /** Registry model names. */
  usedBy: string[];
};

/** How an entry reads as a card on the research index. */
export type IndexCard = {
  title: string | null;
  description: string;
  tags: string[];
};

export type PublicationSection = { heading: string; paragraphs: string[] };

export type ResultRow = { label: string; before: string | null; after: string };

export type Publication = {
  slug: string;
  title: string;
  dek: string;
  card: IndexCard;
  /** ISO date. */
  date: string;
  tags: string[];
  sections: PublicationSection[];
  results: { caption: string | null; rows: ResultRow[] } | null;
  sources: Link[];
};

export type Release = {
  /** ISO date. */
  date: string;
  title: string;
  description: string;
  href: string;
  card: IndexCard & { cta: string };
};

export type Application = {
  name: string;
  href: string;
  /** What the card's link names: the site's own address. */
  domain: string;
  logo: SanityImage;
  logoSize: LogoSize;
  description: string;
  tags: string[];
};

/** A model's written copy; the model itself is in the registry (code). */
export type ModelCopy = {
  slug: string;
  tagline: string;
  overview: string;
  metrics: { value: string; label: string }[];
  capabilities: string[];
  achievements: string[];
  usage: { language: string; code: string };
};

/** A language's details, written in the Studio. */
export type LanguageCopy = {
  code: string;
  /** Null where it isn't commonly written. */
  endonym: string | null;
  family: string;
  branch: string;
  script: string;
  regions: string[];
  tagline: string;
};

export type Partner = {
  name: string;
  /** Null where there is no site to link to. */
  href: string | null;
  logo: SanityImage;
  logoSize: LogoSize;
};

export type Announcement = {
  /** Changing it shows the announcement again to people who dismissed one. */
  key: string;
  message: string;
  link: Link | null;
};

export type SiteSettings = {
  statement: string;
  tagline: string;
  organization: { name: string; href: string };
  /** Null when switched off. */
  announcement: Announcement | null;
};

export type Footer = {
  /** The title beside the partner logos. */
  powering: string;
  /** The line under the logo, before the organization's name. */
  initiative: string;
  /** Follows © and the year. */
  copyright: string;
  partners: Partner[];
  columns: { title: string; links: Link[] }[];
  legalLinks: Link[];
};

export type Content = {
  settings: SiteSettings;
  footer: Footer;
  datasets: Dataset[];
  /** Oldest first. */
  publications: Publication[];
  /** Newest first. */
  releases: Release[];
  applications: Application[];
  languages: LanguageCopy[];
  models: ModelCopy[];
};
