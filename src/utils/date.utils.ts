/**
 * ============================================
 * CENTRALIZED DATE/TIME UTILITIES
 * ============================================
 * 
 * Standard timezone: Asia/Ho_Chi_Minh (UTC+7)
 * 
 * RULES:
 * - Database stores dates in YYYY-MM-DD format (date only fields)
 * - Database stores times in HH:mm:ss format (time only fields)
 * - Timestamps use ISO 8601 format
 * - All display formatting happens on Frontend
 */

import dayjs = require("dayjs");
import utc = require("dayjs/plugin/utc");
import timezone = require("dayjs/plugin/timezone");
import isoWeek = require("dayjs/plugin/isoWeek");

// Extend plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

// ============================================
// CONSTANTS
// ============================================

/** Standard timezone for the application */
export const TIMEZONE = "Asia/Ho_Chi_Minh";

/** Standard date/time formats */
export const DATE_FORMATS = {
    /** Date only for DB storage: 2025-12-14 */
    DATE_ONLY: "YYYY-MM-DD",

    /** Time only for DB storage: 14:30:00 */
    TIME_ONLY: "HH:mm:ss",

    /** Time short for display: 14:30 */
    TIME_SHORT: "HH:mm",

    /** Full datetime for DB: 2025-12-14T14:30:00 */
    DATETIME: "YYYY-MM-DDTHH:mm:ss",

    /** Display date format: 14/12/2025 */
    DISPLAY_DATE: "DD/MM/YYYY",

    /** Display datetime: 14/12/2025 14:30 */
    DISPLAY_DATETIME: "DD/MM/YYYY HH:mm",
} as const;

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get current datetime in local timezone
 */
export function now(): dayjs.Dayjs {
    return dayjs().tz(TIMEZONE);
}

/**
 * Parse any date string/object to dayjs in local timezone
 */
export function parseDate(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
    return dayjs(date).tz(TIMEZONE);
}

/**
 * Get today's date in DB format (YYYY-MM-DD)
 */
export function today(): string {
    return now().format(DATE_FORMATS.DATE_ONLY);
}

/**
 * Format date for DB storage (YYYY-MM-DD)
 */
export function toDateString(date: string | Date | dayjs.Dayjs): string {
    return parseDate(date).format(DATE_FORMATS.DATE_ONLY);
}

/**
 * Format time for DB storage (HH:mm:ss)
 */
export function toTimeString(date: string | Date | dayjs.Dayjs): string {
    return parseDate(date).format(DATE_FORMATS.TIME_ONLY);
}

/**
 * Format datetime for DB storage (YYYY-MM-DDTHH:mm:ss)
 */
export function toDateTimeString(date: string | Date | dayjs.Dayjs): string {
    return parseDate(date).format(DATE_FORMATS.DATETIME);
}

// ============================================
// WEEK FUNCTIONS (ISO Week - Monday start)
// ============================================

/**
 * Get week start (Monday) from any date
 * @returns YYYY-MM-DD format
 */
export function getWeekStart(date: string | Date | dayjs.Dayjs): string {
    return parseDate(date).startOf("isoWeek").format(DATE_FORMATS.DATE_ONLY);
}

/**
 * Get week end (Sunday) from any date
 * @returns YYYY-MM-DD format
 */
export function getWeekEnd(date: string | Date | dayjs.Dayjs): string {
    return parseDate(date).endOf("isoWeek").format(DATE_FORMATS.DATE_ONLY);
}

/**
 * Get ISO week number
 */
export function getWeekNumber(date: string | Date | dayjs.Dayjs): number {
    return parseDate(date).isoWeek();
}

/**
 * Get all days in a week (Monday to Sunday)
 * @returns Array of YYYY-MM-DD strings
 */
export function getDaysInWeek(weekStart: string): string[] {
    const start = parseDate(weekStart);
    const days: string[] = [];

    for (let i = 0; i < 7; i++) {
        days.push(start.add(i, "day").format(DATE_FORMATS.DATE_ONLY));
    }

    return days;
}

// ============================================
// TIME CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate hours between two times
 * @param startTime - HH:mm:ss or HH:mm format
 * @param endTime - HH:mm:ss or HH:mm format
 * @returns Number of hours (can be decimal)
 */
export function calculateHours(startTime: string, endTime: string): number {
    const start = dayjs(`2000-01-01T${startTime}`);
    const end = dayjs(`2000-01-01T${endTime}`);

    let diff = end.diff(start, "hour", true);

    // Handle overnight shifts
    if (diff < 0) {
        diff += 24;
    }

    return Math.max(0, diff);
}

/**
 * Check if two time ranges overlap
 */
export function isTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
): boolean {
    const s1 = dayjs(`2000-01-01T${start1}`).valueOf();
    const e1 = dayjs(`2000-01-01T${end1}`).valueOf();
    const s2 = dayjs(`2000-01-01T${start2}`).valueOf();
    const e2 = dayjs(`2000-01-01T${end2}`).valueOf();

    return s1 < e2 && e1 > s2;
}

/**
 * Calculate rest hours between two shifts
 */
export function calculateRestHours(
    shift1EndTime: string,
    shift1Date: string,
    shift2StartTime: string,
    shift2Date: string
): number {
    const end = parseDate(`${shift1Date}T${shift1EndTime}`);
    const start = parseDate(`${shift2Date}T${shift2StartTime}`);

    const hours = start.diff(end, "hour", true);
    return Math.max(0, hours);
}

// Export dayjs for direct use if needed
export { dayjs };
