/**
 * Format a trip ISO timestamp as a wall-clock time.
 * All trip times are stored as UTC "wall clock" values (the server treats
 * the user's local input as UTC), so we read UTC fields directly so the
 * display is consistent regardless of the browser's timezone.
 */
export function formatTripTime(isoString: string): string {
  const d = new Date(isoString);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function formatTripDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
