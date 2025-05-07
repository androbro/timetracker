"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { WeeklyTimeEntry } from "~/components/WeeklyTimeEntry";
import {
	Settings,
	type TimeSettings,
	type DaySettings
} from "~/components/Settings";

interface WorkWeek {
	id: number;
	weekNumber: number;
	year: number;
	targetHours: number;
	breakDuration: number;
	createdAt: Date;
	updatedAt: Date | null;
	workDays: WorkDayRecord[];
}

// Define a type that helps us safely access possibly missing fields
interface WorkDay {
	date: Date;
	totalHours: number;
	isDayOff?: boolean;
	isHoliday?: boolean;
}

// Add a new interface to define the database record type
interface WorkDayRecord {
	id: number;
	weekId: number;
	date: string | Date;
	startTime: string;
	endTime: string;
	totalHours: number;
	isDayOff: boolean;
	createdAt?: string | Date;
	updatedAt?: string | Date;
}

interface TimeEntry {
	hours: number;
	isDayOff: boolean;
}

export function TimeTracker() {
	const { data: currentWeek, isLoading } = api.time.getCurrentWeek.useQuery();
	const createWeek = api.time.createWeek.useMutation();
	const updateDay = api.time.updateDay.useMutation();
	const updateDaySettings = api.time.updateDaySettings.useMutation();
	const { data: savedDaySettings } = api.time.getDaySettings.useQuery();

	// Default settings with day-specific defaults
	const defaultTimeSettings: TimeSettings = {
		targetHours: 40,
		breakDuration: 30,
		defaultDaySettings: {
			monday: {
				defaultStartTime: "09:00",
				defaultEndTime: "17:00",
				defaultHours: 8
			},
			tuesday: {
				defaultStartTime: "09:00",
				defaultEndTime: "17:00",
				defaultHours: 8
			},
			wednesday: {
				defaultStartTime: "09:00",
				defaultEndTime: "17:00",
				defaultHours: 8
			},
			thursday: {
				defaultStartTime: "09:00",
				defaultEndTime: "17:00",
				defaultHours: 8
			},
			friday: {
				defaultStartTime: "09:00",
				defaultEndTime: "17:00",
				defaultHours: 8
			}
		}
	};

	const [settings, setSettings] = useState<TimeSettings>(defaultTimeSettings);
	const [timeEntries, setTimeEntries] = useState<Record<string, TimeEntry>>({});

	// Load saved day settings when component mounts
	useEffect(() => {
		if (savedDaySettings) {
			setSettings((prev) => ({
				...prev,
				defaultDaySettings: {
					...prev.defaultDaySettings,
					...savedDaySettings
				}
			}));
		}
	}, [savedDaySettings]);

	// Helper function to get the first day (Sunday) of a specific week
	const getFirstDayOfWeek = (year: number, weekNumber: number): Date => {
		// Create a date for Jan 1 of the year
		const januaryFirst = new Date(year, 0, 1);

		// Calculate days to first Sunday of the year
		const daysToFirstSunday = (7 - januaryFirst.getDay()) % 7;

		// Calculate days to the Sunday of the target week
		const daysToTargetSunday = daysToFirstSunday + (weekNumber - 1) * 7;

		// Create and return the date
		const firstDay = new Date(year, 0, 1 + daysToTargetSunday);
		return firstDay;
	};

	// Helper function to get a consistent date for a day of the week
	const getDateForDayInCurrentWeek = (day: string): Date => {
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
	};

	useEffect(() => {
		if (currentWeek) {
			// Update settings from database
			setSettings((prev) => ({
				...prev,
				targetHours: currentWeek.targetHours,
				breakDuration: currentWeek.breakDuration
			}));

			// Convert current week data to time entries format
			const entries: Record<string, TimeEntry> = {};
			for (const day of currentWeek.workDays) {
				const date = new Date(day.date);
				const dayName = date
					.toLocaleDateString("en-US", { weekday: "long" })
					.toLowerCase();

				// Safely access fields that might not exist in the database yet
				const workDay = day as unknown as WorkDay;

				entries[dayName] = {
					hours: day.totalHours / 60, // Convert minutes to hours
					isDayOff: workDay.isDayOff ?? false
				};
			}
			setTimeEntries(entries);
		}
	}, [currentWeek]);

	const handleTimeEntryChange = async (
		entries: Record<string, TimeEntry>,
		changedDay?: string
	) => {
		setTimeEntries(entries);

		if (!currentWeek) {
			const now = new Date();
			const weekNumber = getWeekNumber(now);
			const year = now.getFullYear();

			const week = await createWeek.mutateAsync({
				weekNumber,
				year,
				targetHours: settings.targetHours,
				breakDuration: settings.breakDuration
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

					await updateDay.mutateAsync({
						weekId: weekId,
						date,
						startTime,
						endTime,
						totalHours: totalMinutes, // Store as minutes
						isDayOff: entries[day].isDayOff
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
					(d) => new Date(d.date).toDateString() === date.toDateString()
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
					await updateDay.mutateAsync({
						weekId: currentWeek.id,
						date,
						startTime,
						endTime,
						totalHours: totalMinutes, // Store as minutes
						isDayOff: entries[day].isDayOff
					});
				} catch (error) {
					console.error(`Error updating ${day}:`, error);
					// Optionally retry once on error
				}
			}
		}
	};

	const handleSettingsChange = (newSettings: TimeSettings) => {
		setSettings(newSettings);
	};

	const handleDaySettingsChange = async (
		day: string,
		daySettings: DaySettings
	) => {
		// Update local state first for immediate UI feedback
		setSettings((prev) => {
			// Create a new defaultDaySettings object
			const newDaySettings = { ...prev.defaultDaySettings };

			// Ensure the day settings object is fully defined
			newDaySettings[day] = {
				defaultStartTime: daySettings.defaultStartTime || "09:00",
				defaultEndTime: daySettings.defaultEndTime || "17:00",
				defaultHours: daySettings.defaultHours ?? 8
			};

			return {
				...prev,
				defaultDaySettings: newDaySettings
			};
		});

		// Then save to the database
		try {
			await updateDaySettings.mutateAsync({
				dayName: day,
				defaultStartTime: daySettings.defaultStartTime || "09:00",
				defaultEndTime: daySettings.defaultEndTime || "17:00",
				defaultHours: daySettings.defaultHours ?? 8
			});
		} catch (error) {
			console.error("Failed to save day settings:", error);
			// You could implement error handling or rollback here
		}
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="grid gap-6">
			<WeeklyTimeEntry
				initialEntries={timeEntries}
				onTimeEntryChange={handleTimeEntryChange}
				targetHours={settings.targetHours}
				defaultDaySettings={settings.defaultDaySettings}
				onDaySettingsChange={handleDaySettingsChange}
			/>
			<Settings
				initialSettings={settings}
				onSettingsChange={handleSettingsChange}
			/>
		</div>
	);
}

function getWeekNumber(date: Date): number {
	const d = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
	);
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getDayNumber(day: string): number {
	const days: Record<string, number> = {
		sunday: 0,
		monday: 1,
		tuesday: 2,
		wednesday: 3,
		thursday: 4,
		friday: 5,
		saturday: 6
	};
	return days[day] ?? 0;
}
