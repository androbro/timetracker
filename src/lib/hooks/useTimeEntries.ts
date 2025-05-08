import { useEffect, useRef, useState } from "react";
import type { TimeSettings } from "~/components/Settings";
import { getDateForDayInCurrentWeek, getWeekNumber } from "./useDateHelpers";
import { useWeekData } from "./useWeekData";

// Local time entry interface
export interface TimeEntry {
	hours: number;
	isDayOff: boolean;
	startTime?: string;
	endTime?: string;
	lunchBreakHours?: number;
}

/**
 * Hook to manage time entries
 */
export function useTimeEntries(settings: TimeSettings) {
	const [timeEntries, setTimeEntries] = useState<Record<string, TimeEntry>>({});
	const { currentWeek, createNewWeek, updateDayInWeek } = useWeekData();
	const [initialDataLoaded, setInitialDataLoaded] = useState(false);
	const [hasLocalChanges, setHasLocalChanges] = useState(false);
	// Reference to track local changes across renders
	const hasLocalChangesRef = useRef(false);

	console.log("[useTimeEntries] Initial state:", {
		hasLocalChanges,
		currentWeek: !!currentWeek,
	});

	// Update time entries when current week data changes
	useEffect(() => {
		console.log("[useTimeEntries] Effect triggered:", {
			hasCurrentWeek: !!currentWeek,
			hasLocalChanges,
			hasLocalChangesRef: hasLocalChangesRef.current,
			workDaysCount: currentWeek?.workDays?.length,
		});

		if (currentWeek && !hasLocalChangesRef.current) {
			console.log("[useTimeEntries] Loading data from server");
			// Convert current week data to time entries format
			const entries: Record<string, TimeEntry> = {};
			for (const day of currentWeek.workDays) {
				const date = new Date(day.date);
				const dayName = date
					.toLocaleDateString("en-US", { weekday: "long" })
					.toLowerCase();

				// Safely access fields that might not exist in the database yet
				// Convert lunchBreakHours from minutes to hours
				entries[dayName] = {
					hours: day.totalHours / 60, // Convert minutes to hours
					isDayOff: day.isDayOff ?? false,
					startTime: day.startTime,
					endTime: day.endTime,
					lunchBreakHours:
						(day.lunchBreakMinutes || settings.breakDuration) / 60, // Convert from minutes to hours
				};
				console.log(
					`[useTimeEntries] Day ${dayName} from server:`,
					entries[dayName],
				);
			}
			console.log("[useTimeEntries] Setting entries from server:", entries);
			setTimeEntries(entries);
			setInitialDataLoaded(true);
		} else if (currentWeek && hasLocalChangesRef.current) {
			console.log("[useTimeEntries] Skipping server data due to local changes");
		}
	}, [currentWeek, hasLocalChanges, settings.breakDuration]);

	/**
	 * Updates time entries and syncs with the database
	 */
	const handleTimeEntryChange = async (
		entries: Record<string, TimeEntry>,
		changedDay?: string,
	) => {
		console.log("[useTimeEntries] handleTimeEntryChange called:", {
			entries,
			changedDay,
			hasCurrentWeek: !!currentWeek,
		});

		// Mark that we have local changes to prevent server data from overwriting
		setHasLocalChanges(true);
		hasLocalChangesRef.current = true;
		console.log("[useTimeEntries] hasLocalChanges set to true");

		setTimeEntries(entries);

		if (!currentWeek) {
			console.log("[useTimeEntries] No current week, creating new week");
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

				console.log(
					"[useTimeEntries] Created new week, updating days:",
					daysToUpdate,
				);

				for (const day of daysToUpdate) {
					if (!entries[day]) continue; // Skip if entry doesn't exist

					// Create a date object for the current day of this week
					const date = getDateForDayInCurrentWeek(day);

					// Get default start/end times from settings
					const daySettings = settings.defaultDaySettings[day];
					const startTime =
						entries[day].startTime || daySettings?.defaultStartTime || "09:00";
					const endTime =
						entries[day].endTime || daySettings?.defaultEndTime || "17:00";

					// Convert hours to minutes as integers for storage
					const totalMinutes = Math.round(entries[day].hours * 60);
					// Convert lunch break hours to minutes
					const lunchBreakMinutes = Math.round(
						(entries[day].lunchBreakHours || 0.5) * 60,
					);

					console.log(`[useTimeEntries] Updating day ${day}:`, {
						hours: entries[day].hours,
						totalMinutes,
						lunchBreakHours: entries[day].lunchBreakHours,
						lunchBreakMinutes,
						startTime,
						endTime,
					});

					await updateDayInWeek({
						weekId: weekId,
						date,
						startTime,
						endTime,
						totalHours: totalMinutes, // Store as minutes
						lunchBreakMinutes, // Store lunch break in minutes
						isDayOff: entries[day].isDayOff,
					});
				}
			}
		} else {
			// Only update the changed day if specified
			const daysToUpdate = changedDay ? [changedDay] : Object.keys(entries);
			console.log(
				"[useTimeEntries] Updating existing week, days:",
				daysToUpdate,
			);

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
					entries[day].startTime ||
					existingDay?.startTime ||
					daySettings?.defaultStartTime ||
					"09:00";
				const endTime =
					entries[day].endTime ||
					existingDay?.endTime ||
					daySettings?.defaultEndTime ||
					"17:00";

				// Convert hours to minutes as integers for storage
				const totalMinutes = Math.round(entries[day].hours * 60);
				// Convert lunch break hours to minutes
				const lunchBreakMinutes = Math.round(
					(entries[day].lunchBreakHours || 0.5) * 60,
				);

				console.log(`[useTimeEntries] Updating day ${day} in DB:`, {
					hours: entries[day].hours,
					totalMinutes,
					lunchBreakHours: entries[day].lunchBreakHours,
					lunchBreakMinutes,
					startTime,
					endTime,
				});

				try {
					await updateDayInWeek({
						weekId: currentWeek.id,
						date,
						startTime,
						endTime,
						totalHours: totalMinutes, // Store as minutes
						lunchBreakMinutes, // Store lunch break in minutes
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
