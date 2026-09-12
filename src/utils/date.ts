/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a Unix timestamp, Date object, or string in the user's local timezone
 * (defaulting cleanly to Asia/Kolkata for Indian users).
 * Conforming to format: 6 Jul 2026, 12:36 AM
 */
export function formatLocalTimestamp(
  created: number | string | Date,
  customTimeZone?: string
): string {
  if (!created) return "";
  
  // Handle some special string formats if any, otherwise parse to Date
  const date = new Date(created);
  if (isNaN(date.getTime())) {
    return String(created);
  }

  try {
    let tz = customTimeZone;
    if (!tz) {
      try {
        tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
      } catch {
        tz = "Asia/Kolkata";
      }
    }

    const day = date.toLocaleString("en-US", { day: "numeric", timeZone: tz });
    const month = date.toLocaleString("en-US", { month: "short", timeZone: tz });
    const year = date.toLocaleString("en-US", { year: "numeric", timeZone: tz });
    let timeStr = date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: tz
    });

    // Ensure AM/PM is uppercase
    timeStr = timeStr.toUpperCase().replace(/\s+/g, " ").trim();

    return `${day} ${month} ${year}, ${timeStr}`;
  } catch (err) {
    console.error("Error formatting timestamp:", err);
    return String(created);
  }
}

/**
 * Backwards compatible alias for existing components importing formatKolkataTimestamp
 */
export const formatKolkataTimestamp = formatLocalTimestamp;
