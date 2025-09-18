export function normalizeProjectTitle(title: string): string {
  return title
    ? title
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
    : "";
}
