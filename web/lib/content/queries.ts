import { defineQuery } from "next-sanity";

// GROQ for the site's content, shaped to the types in types.ts. Optional
// lists come back as [] rather than null, so pages can map them directly.

const image = `{ url, "width": metadata.dimensions.width, "height": metadata.dimensions.height }`;
const link = `{ label, href }`;

export const CONTENT_QUERY = defineQuery(`{
  "settings": *[_id == "siteSettings"][0]{
    statement,
    tagline,
    organization{ name, href },
    "announcement": select(
      announcement.enabled != false && defined(announcement.message) => announcement{
        "key": key.current,
        message,
        "link": select(defined(link.href) => link${link}, null)
      },
      null
    )
  },
  "footer": *[_id == "footer"][0]{
    powering,
    initiative,
    copyright,
    "partners": coalesce(partners[]{ name, href, logoSize, "logo": logo.asset->${image} }, []),
    "columns": coalesce(columns[]{ title, "links": coalesce(links[]${link}, []) }, []),
    "legalLinks": coalesce(legalLinks[]${link}, [])
  },
  "datasets": *[_type == "dataset"] | order(order asc){
    "slug": slug.current,
    name,
    kind,
    "languages": coalesce(languages, []),
    domains,
    source,
    href,
    description,
    used,
    "usedBy": coalesce(usedBy, [])
  },
  "publications": *[_type == "publication"] | order(date asc){
    "slug": slug.current,
    title,
    dek,
    date,
    "tags": coalesce(tags, []),
    "sections": coalesce(sections[]{ heading, "paragraphs": coalesce(paragraphs, []) }, []),
    "results": select(count(results.rows) > 0 => results{ caption, rows[]{ label, before, after } }, null),
    "sources": coalesce(sources[]${link}, []),
    "card": card{ title, description, "tags": coalesce(tags, []) }
  },
  "releases": *[_type == "release"] | order(date desc){
    date,
    title,
    description,
    href,
    "card": card{ title, description, "tags": coalesce(tags, []), cta }
  },
  "applications": *[_type == "application"] | order(order asc){
    name,
    href,
    domain,
    "logo": logo.asset->${image},
    logoSize,
    description,
    "tags": coalesce(tags, [])
  },
  "models": *[_type == "model" && defined(slug)]{
    slug,
    tagline,
    overview,
    "metrics": coalesce(metrics[]{ value, label }, []),
    "capabilities": coalesce(capabilities, []),
    "achievements": coalesce(achievements, []),
    "usage": coalesce(usage{ "language": coalesce(language, "python"), code }, { "language": "python", "code": "" })
  }
}`);

export const LEGAL_PAGE_QUERY = defineQuery(`*[_type == "legalPage" && _id == $id][0]{
  title,
  description,
  updated,
  body,
  "closing": coalesce(closing, [])
}`);
