/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a Unix timestamp, Date object, or string in the Asia/Kolkata timezone.
 * Conforming to format: 6 Jul 2026, 12:36 AM
 */
export function formatKolkataTimestamp(created: number | string | Date): string {
  if (!created) return "";
  
  // Handle some special string formats if any, otherwise parse to Date
  const date = new Date(created);
  if (isNaN(date.getTime())) {
    return String(created);
  }

  try {
    const day = date.toLocaleString("en-US", { day: "numeric", timeZone: "Asia/Kolkata" });
    const month = date.toLocaleString("en-US", { month: "short", timeZone: "Asia/Kolkata" });
    const year = date.toLocaleString("en-US", { year: "numeric", timeZone: "Asia/Kolkata" });
    let timeStr = date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    });

    // Ensure AM/PM is uppercase
    timeStr = timeStr.toUpperCase().replace(/\s+/g, " ").trim();

    return `${day} ${month} ${year}, ${timeStr}`;
  } catch (err) {
    console.error("Error formatting timestamp:", err);
    return String(created);
  }
}
