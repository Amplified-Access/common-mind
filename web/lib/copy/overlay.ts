// A page's copy is a fixed tree of text: strings, lists of strings, and
// groups of either. The tree's shape and its original wording live in code
// (lib/copy/pages); editors change the words in the Studio.

export type CopyValue = string | string[] | CopyTree;
export interface CopyTree {
  [key: string]: CopyValue;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const filled = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

/**
 * Lays an editor's published text over the original wording. Each field
 * takes the editor's text when there is some, and the original otherwise
 * (an emptied field restores it). Fields the page doesn't have are ignored.
 */
export function overlay<T extends CopyTree>(defaults: T, edits: unknown): T {
  if (!isRecord(edits)) return defaults;
  const result: CopyTree = {};
  for (const [key, original] of Object.entries(defaults)) {
    const edit = edits[key];
    if (typeof original === "string") {
      result[key] = filled(edit) ? edit : original;
    } else if (Array.isArray(original)) {
      const items = Array.isArray(edit) ? edit.filter(filled) : [];
      result[key] = items.length > 0 ? items : original;
    } else {
      result[key] = overlay(original, edit);
    }
  }
  return result as T;
}
