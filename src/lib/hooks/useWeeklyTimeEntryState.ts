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

	// Create a default TimeEntry with all required fields - memoized to prevent rerenders
	const createDefaultTimeEntry = useCallback(
		(existingEntry?: Partial<TimeEntry>): TimeEntry => {
			return {
				hours: existingEntry?.hours ?? 0,
				isDayOff: existingEntry?.isDayOff ?? false,
				startTime: existingEntry?.startTime ?? "",
				endTime: existingEntry?.endTime ?? "",
				lunchBreakHours: existingEntry?.lunchBreakHours ?? 0.5,
				verified: existingEntry?.verified ?? false,
			};
		},
		[],
	);

	// Helper function to merge initialEntries with defaultDaySettings
	const mergeEntries = useCallback(
		(initEntries: Partial<Record<string, Partial<TimeEntry>>>) => {
			const result: Record<string, TimeEntry> = {};

			// First initialize all days with default settings
			for (const [day, settings] of Object.entries(defaultDaySettings)) {
				const dayKey = day as DayKey;
				const startTime = settings.defaultStartTime;
				const endTime = settings.defaultEndTime;
				const lunchBreakHours = 0.5; // Default lunch break

				// Pre-calculate hours
				const calculatedHours = calculateHours(
					startTime,
					endTime,
					lunchBreakHours,
				);

				// Apply default settings for the day
				result[dayKey] = {
					hours: calculatedHours,
					isDayOff: false,
					startTime,
					endTime,
					lunchBreakHours,
				};
			}

			// Override with any initial entries that were passed in
			const hasInitialEntries = Object.keys(initEntries).length > 0;
			if (hasInitialEntries) {
				for (const [day, entry] of Object.entries(initEntries)) {
					if (!entry) continue;
					if (!result[day]) continue;

					// Merge the initial entry with the defaults
					result[day] = {
						...result[day],
						...entry,
						// Ensure all required properties are defined
						hours: entry.hours ?? result[day].hours,
						isDayOff: entry.isDayOff ?? result[day].isDayOff,
						startTime: entry.startTime ?? result[day].startTime,
						endTime: entry.endTime ?? result[day].endTime,
						lunchBreakHours:
							entry.lunchBreakHours ?? result[day].lunchBreakHours,
					};
				}
			}

			return result;
		},
		[defaultDaySettings, calculateHours],
	);

	// State to store the time entries
	const [timeEntries, setTimeEntries] = useState(() =>
		mergeEntries(initialEntries),
	);

	// Recalculate entries when initialEntries change
	useEffect(() => {
		// Merge entries with new settings
		const newEntries = mergeEntries(initialEntries);
		setTimeEntries(newEntries);
	}, [initialEntries, mergeEntries]);

	// Calculate total hours
	const totalHours = useMemo(() => {
		return Object.values(timeEntries).reduce(
			(total, entry) => total + (entry.isDayOff ? 0 : entry.hours),
			0,
		);
	}, [timeEntries]);

	// Handle time change for a specific day
	const handleTimeChange = useCallback(
		(day: string, field: "startTime" | "endTime", value: string) => {
			setTimeEntries((prev) => {
				const entry = prev[day] || createDefaultTimeEntry();

				// Update the entry
				const updatedEntry: TimeEntry = {
					...entry,
					[field]: value,
				};

				// Recalculate hours if we have both start and end time
				if (updatedEntry.startTime && updatedEntry.endTime) {
					updatedEntry.hours = calculateHours(
						updatedEntry.startTime,
						updatedEntry.endTime,
						updatedEntry.lunchBreakHours,
					);
				}

				const result: Record<string, TimeEntry> = {
					...prev,
					[day]: updatedEntry,
				};

				// Notify parent about the change
				onTimeEntryChange?.(result, day);

				return result;
			});
		},
		[calculateHours, onTimeEntryChange, createDefaultTimeEntry],
	);

	// Handle lunch break change for a specific day
	const handleLunchBreakChange = useCallback(
		(day: string, value: number) => {
			setTimeEntries((prev) => {
				const entry = prev[day] || createDefaultTimeEntry();

				// Update the entry
				const updatedEntry: TimeEntry = {
					...entry,
					lunchBreakHours: value,
				};

				// Recalculate hours if we have both start and end time
				if (updatedEntry.startTime && updatedEntry.endTime) {
					updatedEntry.hours = calculateHours(
						updatedEntry.startTime,
						updatedEntry.endTime,
						updatedEntry.lunchBreakHours,
					);
				}

				const result: Record<string, TimeEntry> = {
					...prev,
					[day]: updatedEntry,
				};

				// Notify parent about the change
				onTimeEntryChange?.(result, day);

				return result;
			});
		},
		[calculateHours, onTimeEntryChange, createDefaultTimeEntry],
	);

	// Handle day off toggle for a specific day
	const handleDayOffToggle = useCallback(
		(day: string, isDayOff: boolean) => {
			setTimeEntries((prev) => {
				const entry = prev[day] || createDefaultTimeEntry();

				// Update the entry
				const updatedEntry: TimeEntry = {
					...entry,
					isDayOff,
				};

				const result: Record<string, TimeEntry> = {
					...prev,
					[day]: updatedEntry,
				};

				// Notify parent about the change
				onTimeEntryChange?.(result, day);

				return result;
			});
		},
		[onTimeEntryChange, createDefaultTimeEntry],
	);

	// Handle verification toggle for a specific day
	const handleVerifyToggle = useCallback(
		(day: string, verified: boolean) => {
			setTimeEntries((prev) => {
				const entry = prev[day] || createDefaultTimeEntry();

				// Update the entry
				const updatedEntry: TimeEntry = {
					...entry,
					verified,
				};

				const result: Record<string, TimeEntry> = {
					...prev,
					[day]: updatedEntry,
				};

				// Notify parent about the change
				onTimeEntryChange?.(result, day);

				return result;
			});
		},
		[onTimeEntryChange, createDefaultTimeEntry],
	);

	/**
	 * Apply default hours to days based on settings
	 */
	const applyDefaultHours = useCallback(() => {
		setTimeEntries((prev) => {
			const newEntries: Record<string, TimeEntry> = { ...prev };

			for (const [day, settings] of Object.entries(defaultDaySettings)) {
				// Skip day if it's marked as a day off
				if (newEntries[day]?.isDayOff) continue;

				// Apply default time settings
				const startTime = settings.defaultStartTime;
				const endTime = settings.defaultEndTime;
				const lunchBreakHours = newEntries[day]?.lunchBreakHours ?? 0.5;

				// Calculate hours
				const hours = calculateHours(startTime, endTime, lunchBreakHours);

				// Update entry
				newEntries[day] = {
					...(newEntries[day] || createDefaultTimeEntry()),
					startTime,
					endTime,
					hours,
					isDayOff: false,
					lunchBreakHours,
				};
			}

			// Notify parent about the change
			onTimeEntryChange?.(newEntries);

			return newEntries;
		});
	}, [
		defaultDaySettings,
		calculateHours,
		onTimeEntryChange,
		createDefaultTimeEntry,
	]);

	/**
	 * Calculate hours needed to reach the target and add them to the last working day
	 */
	const fillTargetHours = useCallback(() => {
		setTimeEntries((prev) => {
			const newEntries: Record<string, TimeEntry> = { ...prev };
			const currentTotal = Object.values(newEntries).reduce(
				(total, entry) => total + (entry.isDayOff ? 0 : entry.hours),
				0,
			);

			// If we've already reached the target, no need to adjust
			if (currentTotal >= targetHours) {
				return prev;
			}

			// Find working days (not marked as day off)
			const workDays = Object.entries(newEntries)
				.filter(([, entry]) => !entry.isDayOff)
				.map(([day]) => day);

			if (workDays.length === 0) {
				return prev; // No working days to adjust
			}

			// Sort work days to ensure we adjust the last working day
			const orderedDays = [
				"monday",
				"tuesday",
				"wednesday",
				"thursday",
				"friday",
				"saturday",
				"sunday",
			].filter((day) => workDays.includes(day));

			// Get the last working day
			const lastWorkDay = orderedDays[orderedDays.length - 1];
			if (!lastWorkDay) return prev;

			// Calculate how many hours we need to add
			const hoursToAdd = targetHours - currentTotal;
			const entry = newEntries[lastWorkDay];

			if (!entry) return prev;

			// Add the hours to the last working day
			newEntries[lastWorkDay] = {
				...entry,
				hours: entry.hours + hoursToAdd,
			};

			// Notify parent about the change
			onTimeEntryChange?.(newEntries, lastWorkDay);

			return newEntries;
		});
	}, [targetHours, onTimeEntryChange]);

	return {
		timeEntries,
		totalHours,
		handleTimeChange,
		handleLunchBreakChange,
		handleDayOffToggle,
		handleVerifyToggle,
		applyDefaultHours,
		fillTargetHours,
	};
}
