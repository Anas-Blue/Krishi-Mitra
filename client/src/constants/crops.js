/**
 * Crop display helpers.
 *
 * The authoritative crop list comes from the API (GET /fields/crops), which is
 * generated from the model's training data. This file only handles presentation
 * and must degrade gracefully for any crop it has no specific entry for.
 */

/** "cotton(lint)" -> "Cotton (Lint)" */
export function cropLabel(crop) {
  if (!crop) return '';
  return String(crop)
    .replace(/\(/g, ' (')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
