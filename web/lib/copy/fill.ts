/**
 * Fills a copy template's {placeholders}: "Datasets for {name}". One the
 * page has no value for stays as written, so a typo shows on the page
 * rather than vanishing.
 */
export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
