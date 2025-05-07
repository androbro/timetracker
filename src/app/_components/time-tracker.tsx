"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import { WeeklyTimeEntry } from "~/components/WeeklyTimeEntry";

interface TimeSettings {
	targetHours: number;
	breakDuration: number;
}

// Define the proper work week record structure
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

	const [settings, setSettings] = useState<TimeSettings>({
		targetHours: 40,
		breakDuration: 30
	});

	const [startTime, setStartTime] = useState<string>("09:00");
	const [endTime, setEndTime] = useState<string>("17:00");
	const [timeEntries, setTimeEntries] = useState<Record<string, TimeEntry>>({});

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
			setSettings({
				targetHours: currentWeek.targetHours,
				breakDuration: currentWeek.breakDuration
			});
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

	const calculateHours = (start: string, end: string) => {
		const [startHoursStr, startMinutesStr] = start.split(":");
		const [endHoursStr, endMinutesStr] = end.split(":");

		if (!startHoursStr || !startMinutesStr || !endHoursStr || !endMinutesStr) {
			return 0;
		}

		const startHours = Number.parseInt(startHoursStr, 10);
		const startMinutes = Number.parseInt(startMinutesStr, 10);
		const endHours = Number.parseInt(endHoursStr, 10);
		const endMinutes = Number.parseInt(endMinutesStr, 10);

		let totalMinutes =
			endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
		totalMinutes -= settings.breakDuration;

		return totalMinutes / 60;
	};

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

	const handleApplyTimeToWorkdays = async () => {
		const calculatedHours = calculateHours(startTime, endTime);
		if (calculatedHours <= 0) return;

		const workdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
		const newEntries = { ...timeEntries };
		const changedDays: string[] = [];

		for (const day of workdays) {
			if (newEntries[day] && !newEntries[day].isDayOff) {
				// Only mark as changed if the hours are actually different
				if (newEntries[day].hours !== calculatedHours) {
					newEntries[day] = {
						...newEntries[day],
						hours: calculatedHours
					};
					changedDays.push(day);
				}
			}
		}

		// Update state immediately for UI responsiveness
		setTimeEntries(newEntries);

		// No days to update
		if (changedDays.length === 0) return;

		// If we don't have a current week, create it first
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
				// Update days in parallel for better performance
				const weekId = week[0].id;

				await Promise.all(
					changedDays.map(async (day) => {
						const dayEntry = newEntries[day];
						if (!dayEntry) return; // Skip if entry doesn't exist

						const date = getDateForDayInCurrentWeek(day);
						const totalMinutes = Math.round(dayEntry.hours * 60);

						try {
							await updateDay.mutateAsync({
								weekId: weekId,
								date,
								startTime,
								endTime,
								totalHours: totalMinutes,
								isDayOff: dayEntry.isDayOff
							});
						} catch (error) {
							console.error(`Error updating ${day}:`, error);
						}
					})
				);
			}
		} else {
			// Update days in parallel for better performance
			const weekId = currentWeek.id;

			await Promise.all(
				changedDays.map(async (day) => {
					const dayEntry = newEntries[day];
					if (!dayEntry) return; // Skip if entry doesn't exist

					const date = getDateForDayInCurrentWeek(day);
					const totalMinutes = Math.round(dayEntry.hours * 60);

					try {
						await updateDay.mutateAsync({
							weekId: weekId,
							date,
							startTime,
							endTime,
							totalHours: totalMinutes,
							isDayOff: dayEntry.isDayOff
						});
					} catch (error) {
						console.error(`Error updating ${day}:`, error);
					}
				})
			);
		}
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="grid gap-6">
			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Settings</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="weekly-hours" className="text-sm font-medium">
								Weekly Hours
							</label>
							<Select
								value={settings.targetHours.toString()}
								onValueChange={(value) =>
									setSettings((prev) => ({
										...prev,
										targetHours: Number(value)
									}))
								}
							>
								<SelectTrigger id="weekly-hours">
									<SelectValue placeholder="Select weekly hours" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="40">40 hours (5 days)</SelectItem>
									<SelectItem value="32">32 hours (4 days)</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label htmlFor="break-duration" className="text-sm font-medium">
								Break Duration (minutes)
							</label>
							<Input
								id="break-duration"
								type="number"
								value={settings.breakDuration}
								onChange={(e) =>
									setSettings((prev) => ({
										...prev,
										breakDuration: Number(e.target.value)
									}))
								}
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			<WeeklyTimeEntry
				initialEntries={timeEntries}
				onTimeEntryChange={handleTimeEntryChange}
				targetHours={settings.targetHours}
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
