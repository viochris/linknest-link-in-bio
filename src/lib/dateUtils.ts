/**
 * Date and time helper utilities for link scheduling & analytics
 */

/**
 * Converts an ISO date string or Date object to YYYY-MM-DDTHH:mm format
 * suitable for standard <input type="datetime-local"> in the user's local timezone.
 */
export function toDateTimeLocalString(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a <input type="datetime-local"> local string to a UTC ISO-8601 string.
 */
export function fromDateTimeLocalToIso(localString: string): string | null {
  if (!localString || !localString.trim()) return null;
  const d = new Date(localString);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Formats a local date-time string or ISO string into human-friendly format
 * e.g., "Thu, Sep 24, 2026 at 09:30 AM"
 */
export function formatFriendlyDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';

  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Generates human readable relative time difference (e.g. "in 3 days, 4 hours" or "5 hours ago")
 */
export function getRelativeTimeString(targetDate: Date, baseDate: Date = new Date()): string {
  const diffMs = targetDate.getTime() - baseDate.getTime();
  const isFuture = diffMs > 0;
  const absMs = Math.abs(diffMs);

  const minutes = Math.floor(absMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours % 24;
    const dayStr = `${days} day${days > 1 ? 's' : ''}`;
    const hrStr = remHours > 0 ? `, ${remHours} hr${remHours > 1 ? 's' : ''}` : '';
    return isFuture ? `in ${dayStr}${hrStr}` : `${dayStr}${hrStr} ago`;
  }

  if (hours > 0) {
    const remMins = minutes % 60;
    const hrStr = `${hours} hour${hours > 1 ? 's' : ''}`;
    const minStr = remMins > 0 ? `, ${remMins} min` : '';
    return isFuture ? `in ${hrStr}${minStr}` : `${hrStr}${minStr} ago`;
  }

  if (minutes > 0) {
    return isFuture ? `in ${minutes} min` : `${minutes} min ago`;
  }

  return isFuture ? 'in moments' : 'just now';
}
