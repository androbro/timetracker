import type { TimeSettings } from "~/components/Settings";
import type { TimeEntry as ImportedTimeEntry } from "~/components/types/timeEntryTypes";
import type { TimeEntry } from "./useTimeEntries";

/**
 * Hook to convert between different time entry formats
 */
export function useTimeEntryMapper() {
	/**
	 * Convert local TimeEntry to the full TimeEntry type expected by EarlyDepartureScheduler
	 */
	const enhanceTimeEntries = (
		entries: Record<string, TimeEntry>,
		settings: TimeSettings,
	): Record<string, ImportedTimeEntry> => {
		const result: Record<string, ImportedTimeEntry> = {};

		for (const [day, entry] of Object.entries(entries)) {
			// Get default settings for the day or use generic defaults
			const daySettings = settings.defaultDaySettings[day];

			result[day] = {
				...entry,
				startTime: entry.startTime || daySettings?.defaultStartTime || "09:00",
				endTime: entry.endTime || daySettings?.defaultEndTime || "17:00",
				lunchBreakHours: entry.lunchBreakHours || settings.breakDuration / 60, // Convert minutes to hours
			};
		}

		return result;
	};

	/**
	 * Convert from enhanced time entries back to simple time entries
	 */
	const simplifyTimeEntries = (
		entries: Record<string, ImportedTimeEntry>,
	): Record<string, TimeEntry> => {
		const simplifiedEntries: Record<string, TimeEntry> = {};

		for (const [day, entry] of Object.entries(entries)) {
			simplifiedEntries[day] = {
				hours: entry.hours,
				isDayOff: entry.isDayOff,
				startTime: entry.startTime,
				endTime: entry.endTime,
				lunchBreakHours: entry.lunchBreakHours,
			};
		}

		return simplifiedEntries;
	};

	return {
		enhanceTimeEntries,
		simplifyTimeEntries,
	};
}
