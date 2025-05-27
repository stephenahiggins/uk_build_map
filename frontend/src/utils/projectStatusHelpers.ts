// Converts a block capital status (e.g., "IN_PROGRESS") to sentence case (e.g., "In progress")
export function projectStatusToSentenceCase(status: string): string {
  if (!status) return '';
  // Replace underscores with spaces, lowercase all, then capitalize first letter
  const lower = status.replace(/_/g, ' ').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
