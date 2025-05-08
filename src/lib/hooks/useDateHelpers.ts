/**
 * Utility functions for date operations
 */

/**
 * Gets the week number for a given date
 */
export function getWeekNumber(date: Date): number {
	const d = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
	);
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Gets the day number (0-6) for a day name
 */
export function getDayNumber(day: string): number {
	const days: Record<string, number> = {
		sunday: 0,
		monday: 1,
		tuesday: 2,
		wednesday: 3,
		thursday: 4,
		friday: 5,
		saturday: 6,
	};
	return days[day] ?? 0;
}

/**
 * Gets the first day (Sunday) of a specific week
 */
export function getFirstDayOfWeek(year: number, weekNumber: number): Date {
	// Create a date for Jan 1 of the year
	const januaryFirst = new Date(year, 0, 1);

	// Calculate days to first Sunday of the year
	const daysToFirstSunday = (7 - januaryFirst.getDay()) % 7;

	// Calculate days to the Sunday of the target week
	const daysToTargetSunday = daysToFirstSunday + (weekNumber - 1) * 7;

	// Create and return the date
	const firstDay = new Date(year, 0, 1 + daysToTargetSunday);
	return firstDay;
}

/**
 * Gets a consistent date for a day of the week in the current week
 */
export function getDateForDayInCurrentWeek(day: string): Date {
	// Get the current date
	const now = new Date();

	// Get the current week number and year
	const weekNumber = getWeekNumber(now);
	const year = now.getFullYear();

	// Calculate the first day of the current week (Sunday)
	const firstDay = getFirstDayOfWeek(year, weekNumber);

	// Add the appropriate number of days
	const date = new Date(firstDay);
	date.setDate(firstDay.getDate() + getDayNumber(day));

	// Standardize the time to noon to avoid timezone issues
	date.setHours(12, 0, 0, 0);

	return date;
}

/**
 * Checks if a day of the current week is in the past
 */
export function isDayInPast(day: string): boolean {
	const today = new Date();
	// Set today to beginning of day for comparison
	today.setHours(0, 0, 0, 0);

	const dayDate = getDateForDayInCurrentWeek(day);
	// Set to beginning of day for comparison
	dayDate.setHours(0, 0, 0, 0);

	return dayDate < today;
}
