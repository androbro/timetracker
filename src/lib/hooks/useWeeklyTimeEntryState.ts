import { useCallback, useEffect, useMemo, useState } from "react";
import type { DaySettings } from "~/components/Settings";
import type { DayKey, TimeEntry } from "~/components/types/timeEntryTypes";
import { useTimeUtils } from "./useTimeUtils";

interface UseWeeklyTimeEntryStateProps {
	initialEntries?: Partial<Record<string, Partial<TimeEntry>>>;
	defaultDaySettings: Record<string, DaySettings>;
	targetHours: number;
	onTimeEntryChange?: (
		entries: Record<string, TimeEntry>,
		changedDay?: string,
	) => void;
}

export function useWeeklyTimeEntryState({
	initialEntries = {},
	defaultDaySettings,
	targetHours,
	onTimeEntryChange,
}: UseWeeklyTimeEntryStateProps) {
	const { calculateHours } = useTimeUtils();

	console.log("[useWeeklyTimeEntryState] Initializing with:", {
		initialEntries,
		hasInitialEntries: Object.keys(initialEntries).length > 0,
	});

	// Default days configuration - memoize to avoid recreating on every render
	const defaultDays = useMemo<Record<DayKey, TimeEntry>>(
		() => ({
			monday: {
				hours: 0,
				isDayOff: false,
				startTime: "09:00",
				endTime: "17:00",
				lunchBreakHours: 0.5,
			},
			tuesday: {
				hours: 0,
				isDayOff: false,
				startTime: "09:00",
				endTime: "17:00",
				lunchBreakHours: 0.5,
			},
			wednesday: {
				hours: 0,
				isDayOff: false,
				startTime: "09:00",
				endTime: "17:00",
				lunchBreakHours: 0.5,
			},
			thursday: {
				hours: 0,
				isDayOff: false,
				startTime: "09:00",
				endTime: "17:00",
				lunchBreakHours: 0.5,
			},
			friday: {
				hours: 0,
				isDayOff: false,
				startTime: "09:00",
				endTime: "17:00",
				lunchBreakHours: 0.5,
			},
			saturday: {
				hours: 0,
				isDayOff: true,
				startTime: "09:00",
				endTime: "17:00",
				lunchBreakHours: 0.5,
			},
			sunday: {
				hours: 0,
				isDayOff: true,
				startTime: "09:00",
				endTime: "17:00",
				lunchBreakHours: 0.5,
			},
		}),
		[],
	);

	// Function to merge initial entries with defaults and apply day settings
	// Use a more stable dependency array with JSON stringify for objects
	const mergeEntries = useCallback(() => {
		console.log("[useWeeklyTimeEntryState] mergeEntries called");
		// Start with default days
		const merged = { ...defaultDays };

		// Apply default settings first
		for (const [day, settings] of Object.entries(defaultDaySettings)) {
			if (day in merged) {
				const dayKey = day as DayKey;
				merged[dayKey].startTime =
					settings.defaultStartTime || merged[dayKey].startTime;
				merged[dayKey].endTime =
					settings.defaultEndTime || merged[dayKey].endTime;

				const calculatedHours = calculateHours(
					merged[dayKey].startTime,
					merged[dayKey].endTime,
					merged[dayKey].lunchBreakHours,
				);

				console.log(
					`[useWeeklyTimeEntryState] Applied default settings for ${dayKey}:`,
					{
						startTime: merged[dayKey].startTime,
						endTime: merged[dayKey].endTime,
						lunchBreakHours: merged[dayKey].lunchBreakHours,
						calculatedHours,
					},
				);

				merged[dayKey].hours = calculatedHours;
			}
		}

		// Process initial entries and merge them
		for (const [day, entry] of Object.entries(initialEntries)) {
			if (entry && day in defaultDays) {
				// Safe to cast since we've checked day is in defaultDays
				const dayKey = day as DayKey;
				const defaultEntry = merged[dayKey];

				console.log(
					`[useWeeklyTimeEntryState] Processing initialEntry for ${dayKey}:`,
					entry,
				);

				merged[dayKey] = {
					hours:
						typeof entry.hours === "number" ? entry.hours : defaultEntry.hours,
					isDayOff:
						typeof entry.isDayOff === "boolean"
							? entry.isDayOff
							: defaultEntry.isDayOff,
					startTime: entry.startTime || defaultEntry.startTime,
					endTime: entry.endTime || defaultEntry.endTime,
					lunchBreakHours:
						entry.lunchBreakHours || defaultEntry.lunchBreakHours,
				};

				console.log(
					`[useWeeklyTimeEntryState] Merged entry for ${dayKey}:`,
					merged[dayKey],
				);
			}
		}

		console.log("[useWeeklyTimeEntryState] Final merged entries:", merged);
		return merged;
	}, [defaultDays, defaultDaySettings, initialEntries, calculateHours]);

	const [timeEntries, setTimeEntries] = useState<Record<string, TimeEntry>>(
		() => {
			const initial = mergeEntries();
			console.log("[useWeeklyTimeEntryState] Initial state set:", initial);
			return initial;
		},
	);

	// Track changes for onTimeEntryChange callback
	const [changedEntry, setChangedEntry] = useState<{
		entries: Record<string, TimeEntry>;
		day?: string;
	} | null>(null);

	// Update timeEntries only when inputs meaningfully change
	// We'll use a ref to track if this is the first render to avoid unnecessary updates
	useEffect(() => {
		console.log(
			"[useWeeklyTimeEntryState] Dependencies changed, recalculating merged entries",
		);
		// Only update when initialEntries or defaultDaySettings change
		const newEntries = mergeEntries();
		console.log(
			"[useWeeklyTimeEntryState] Setting new entries from dependencies:",
			newEntries,
		);
		setTimeEntries(newEntries);
	}, [mergeEntries]);

	// Handle onTimeEntryChange in a separate effect
	useEffect(() => {
		if (changedEntry && onTimeEntryChange) {
			console.log(
				"[useWeeklyTimeEntryState] Calling onTimeEntryChange with:",
				changedEntry,
			);
			onTimeEntryChange(changedEntry.entries, changedEntry.day);
			setChangedEntry(null);
		}
	}, [changedEntry, onTimeEntryChange]);

	// Handlers for time entry changes
	const handleTimeChange = useCallback(
		(day: string, field: "startTime" | "endTime", value: string) => {
			console.log(
				`[useWeeklyTimeEntryState] handleTimeChange: ${day}.${field} = ${value}`,
			);

			setTimeEntries((prevEntries) => {
				const newEntries = { ...prevEntries };

				if (newEntries[day]) {
					const currentEntry = newEntries[day];
					const updatedEntry: TimeEntry = {
						hours: currentEntry.hours,
						isDayOff: currentEntry.isDayOff,
						startTime: currentEntry.startTime,
						endTime: currentEntry.endTime,
						lunchBreakHours: currentEntry.lunchBreakHours,
						...{ [field]: value },
					};

					// Recalculate hours based on start time, end time and lunch break
					updatedEntry.hours = calculateHours(
						updatedEntry.startTime,
						updatedEntry.endTime,
						updatedEntry.lunchBreakHours,
					);

					console.log(
						`[useWeeklyTimeEntryState] Recalculated hours for ${day}:`,
						{
							before: currentEntry.hours,
							after: updatedEntry.hours,
							startTime: updatedEntry.startTime,
							endTime: updatedEntry.endTime,
							lunchBreakHours: updatedEntry.lunchBreakHours,
						},
					);

					newEntries[day] = updatedEntry;
				}

				// Moved to useEffect
				setChangedEntry({ entries: newEntries, day });
				return newEntries;
			});
		},
		[calculateHours],
	);

	const handleLunchBreakChange = useCallback(
		(day: string, value: string) => {
			setTimeEntries((prevEntries) => {
				const newEntries = { ...prevEntries };
				const lunchBreakHours = Number.parseFloat(value) || 0;

				if (newEntries[day]) {
					const currentEntry = newEntries[day];
					const updatedEntry: TimeEntry = {
						hours: currentEntry.hours,
						isDayOff: currentEntry.isDayOff,
						startTime: currentEntry.startTime,
						endTime: currentEntry.endTime,
						lunchBreakHours: lunchBreakHours,
					};

					// Recalculate hours
					updatedEntry.hours = calculateHours(
						updatedEntry.startTime,
						updatedEntry.endTime,
						updatedEntry.lunchBreakHours,
					);

					newEntries[day] = updatedEntry;
				}

				// Moved to useEffect
				setChangedEntry({ entries: newEntries, day });
				return newEntries;
			});
		},
		[calculateHours],
	);

	const handleDayOffToggle = useCallback((day: string, isDayOff: boolean) => {
		setTimeEntries((prevEntries) => {
			const newEntries = { ...prevEntries };

			// Ensure we have a valid entry for this day before updating
			if (prevEntries[day]) {
				newEntries[day] = {
					...prevEntries[day],
					isDayOff,
					// If marking as day off, reset hours to 0
					hours: isDayOff ? 0 : prevEntries[day].hours,
				};
			}

			// Moved to useEffect
			setChangedEntry({ entries: newEntries, day });
			return newEntries;
		});
	}, []);

	// Apply default hours for all workdays based on settings
	const applyDefaultHours = useCallback(() => {
		setTimeEntries((prevEntries) => {
			const newEntries = { ...prevEntries };

			for (const dayKey of Object.keys(defaultDays) as DayKey[]) {
				// Skip days off
				if (newEntries[dayKey]?.isDayOff) {
					continue;
				}

				// Use day-specific default settings if available
				const daySetting = defaultDaySettings[dayKey];
				if (daySetting && newEntries[dayKey]) {
					const currentEntry = newEntries[dayKey];
					newEntries[dayKey] = {
						...currentEntry,
						startTime: daySetting.defaultStartTime || currentEntry.startTime,
						endTime: daySetting.defaultEndTime || currentEntry.endTime,
						isDayOff: currentEntry.isDayOff,
					};

					// Recalculate hours
					if (newEntries[dayKey]) {
						newEntries[dayKey].hours = calculateHours(
							newEntries[dayKey].startTime,
							newEntries[dayKey].endTime,
							newEntries[dayKey].lunchBreakHours,
						);
					}
				}
			}

			// Moved to useEffect
			setChangedEntry({ entries: newEntries });
			return newEntries;
		});
	}, [calculateHours, defaultDays, defaultDaySettings]);

	// Fill hours to meet target hours
	const fillTargetHours = useCallback(() => {
		setTimeEntries((prevEntries) => {
			// Calculate current total hours
			const currentTotal = Object.values(prevEntries).reduce(
				(sum, entry) => (entry.isDayOff ? sum : sum + entry.hours),
				0,
			);

			// If we already met or exceeded target, no need to adjust
			if (currentTotal >= targetHours) {
				return prevEntries;
			}

			// Calculate remaining hours needed
			const remainingHours = targetHours - currentTotal;

			// Count how many workdays we have
			const workdayCount = Object.values(prevEntries).filter(
				(entry) => !entry.isDayOff,
			).length;

			if (workdayCount === 0) {
				return prevEntries; // No workdays to distribute hours to
			}

			// Distribute remaining hours evenly among workdays
			const hoursPerDay = remainingHours / workdayCount;
			const newEntries = { ...prevEntries };

			// For each workday, adjust end time to add the required hours
			for (const [day, entry] of Object.entries(newEntries)) {
				if (entry.isDayOff) continue;

				// Calculate new end time by adding hoursPerDay
				const startParts = entry.startTime.split(":").map(Number);
				const startHour = startParts[0] || 0;
				const startMinute = startParts[1] || 0;

				// Convert start time to minutes, add work time and lunch break
				const startTimeInMinutes = startHour * 60 + startMinute;
				const workTimeInMinutes = (entry.hours + hoursPerDay) * 60;
				const lunchBreakInMinutes = entry.lunchBreakHours * 60;

				// Calculate new end time in minutes
				const endTimeInMinutes =
					startTimeInMinutes + workTimeInMinutes + lunchBreakInMinutes;

				// Convert back to hours and minutes
				const endHours = Math.floor(endTimeInMinutes / 60);
				const endMinutes = Math.round(endTimeInMinutes % 60);

				// Format as HH:MM
				const newEndTime = `${endHours.toString().padStart(2, "0")}:${endMinutes
					.toString()
					.padStart(2, "0")}`;

				// Update the entry
				entry.endTime = newEndTime;
				entry.hours = calculateHours(
					entry.startTime,
					entry.endTime,
					entry.lunchBreakHours,
				);
			}

			// Moved to useEffect
			setChangedEntry({ entries: newEntries });
			return newEntries;
		});
	}, [calculateHours, targetHours]);

	// Calculate total hours - memoize to avoid recalculation on every render
	const totalHours = useMemo(
		() =>
			Object.values(timeEntries).reduce((sum, entry) => sum + entry.hours, 0),
		[timeEntries],
	);

	return {
		timeEntries,
		totalHours,
		handleTimeChange,
		handleLunchBreakChange,
		handleDayOffToggle,
		applyDefaultHours,
		fillTargetHours,
	};
}
