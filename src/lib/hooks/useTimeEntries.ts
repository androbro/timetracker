import { useEffect, useState } from "react";
import type { DaySettings, TimeSettings } from "~/components/Settings";
import { getDateForDayInCurrentWeek, getWeekNumber } from "./useDateHelpers";
import { useWeekData } from "./useWeekData";

// Local time entry interface
export interface TimeEntry {
	hours: number;
	isDayOff: boolean;
}

/**
 * Hook to manage time entries
 */
export function useTimeEntries(settings: TimeSettings) {
	const [timeEntries, setTimeEntries] = useState<Record<string, TimeEntry>>({});
	const { currentWeek, createNewWeek, updateDayInWeek } = useWeekData();

	// Update time entries when current week data changes
	useEffect(() => {
		if (currentWeek) {
			// Convert current week data to time entries format
			const entries: Record<string, TimeEntry> = {};
			for (const day of currentWeek.workDays) {
				const date = new Date(day.date);
				const dayName = date
					.toLocaleDateString("en-US", { weekday: "long" })
					.toLowerCase();

				// Safely access fields that might not exist in the database yet
				entries[dayName] = {
					hours: day.totalHours / 60, // Convert minutes to hours
					isDayOff: day.isDayOff ?? false,
				};
			}
			setTimeEntries(entries);
		}
	}, [currentWeek]);

	/**
	 * Updates time entries and syncs with the database
	 */
	const handleTimeEntryChange = async (
		entries: Record<string, TimeEntry>,
		changedDay?: string,
	) => {
		setTimeEntries(entries);

		if (!currentWeek) {
			const now = new Date();
			const weekNumber = getWeekNumber(now);
			const year = now.getFullYear();

			const week = await createNewWeek({
				weekNumber,
				year,
				targetHours: settings.targetHours,
				breakDuration: settings.breakDuration,
			});

			if (week && week.length > 0 && week[0]) {
				// If it's a new week, we need to create all days
				const daysToUpdate = changedDay ? [changedDay] : Object.keys(entries);
				const weekId = week[0].id;

				for (const day of daysToUpdate) {
					if (!entries[day]) continue; // Skip if entry doesn't exist

					// Create a date object for the current day of this week
					const date = getDateForDayInCurrentWeek(day);

					// Get default start/end times from settings
					const daySettings = settings.defaultDaySettings[day];
					const startTime = daySettings?.defaultStartTime || "09:00";
					const endTime = daySettings?.defaultEndTime || "17:00";

					// Convert hours to minutes as integers for storage
					const totalMinutes = Math.round(entries[day].hours * 60);

					await updateDayInWeek({
						weekId: weekId,
						date,
						startTime,
						endTime,
						totalHours: totalMinutes, // Store as minutes
						isDayOff: entries[day].isDayOff,
					});
				}
			}
		} else {
			// Only update the changed day if specified
			const daysToUpdate = changedDay ? [changedDay] : Object.keys(entries);

			for (const day of daysToUpdate) {
				if (!entries[day]) continue; // Skip if entry doesn't exist

				// Create a date object for the current day of this week
				const date = getDateForDayInCurrentWeek(day);

				// Find the existing day record to get current start/end times
				const existingDay = currentWeek.workDays.find(
					(d) => new Date(d.date).toDateString() === date.toDateString(),
				);

				// Use existing times or default times from settings
				const daySettings = settings.defaultDaySettings[day];
				const startTime =
					existingDay?.startTime || daySettings?.defaultStartTime || "09:00";
				const endTime =
					existingDay?.endTime || daySettings?.defaultEndTime || "17:00";

				// Convert hours to minutes as integers for storage
				const totalMinutes = Math.round(entries[day].hours * 60);

				try {
					await updateDayInWeek({
						weekId: currentWeek.id,
						date,
						startTime,
						endTime,
						totalHours: totalMinutes, // Store as minutes
						isDayOff: entries[day].isDayOff,
					});
				} catch (error) {
					console.error(`Error updating ${day}:`, error);
				}
			}
		}
	};

	return {
		timeEntries,
		handleTimeEntryChange,
	};
}
