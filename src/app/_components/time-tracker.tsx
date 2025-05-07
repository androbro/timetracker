"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
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

// Define a type that helps us safely access possibly missing fields
interface WorkDay {
	date: Date;
	totalHours: number;
	isDayOff?: boolean;
	isHoliday?: boolean;
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

	const handleTimeEntryChange = async (entries: Record<string, TimeEntry>) => {
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

			if (week[0]) {
				// Update each day's hours
				for (const [day, entry] of Object.entries(entries)) {
					const date = new Date();
					date.setDate(date.getDate() - (date.getDay() - getDayNumber(day)));

					await updateDay.mutateAsync({
						weekId: week[0].id,
						date,
						startTime,
						endTime,
						totalHours: entry.hours * 60, // Convert hours to minutes
						isDayOff: entry.isDayOff
					});
				}
			}
		} else {
			// Update each day's hours
			for (const [day, entry] of Object.entries(entries)) {
				const date = new Date();
				date.setDate(date.getDate() - (date.getDay() - getDayNumber(day)));

				await updateDay.mutateAsync({
					weekId: currentWeek.id,
					date,
					startTime,
					endTime,
					totalHours: entry.hours * 60, // Convert hours to minutes
					isDayOff: entry.isDayOff
				});
			}
		}
	};

	const handleApplyTimeToWorkdays = () => {
		const calculatedHours = calculateHours(startTime, endTime);
		if (calculatedHours <= 0) return;

		const workdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
		const newEntries = { ...timeEntries };

		for (const day of workdays) {
			if (newEntries[day] && !newEntries[day].isDayOff) {
				newEntries[day] = {
					...newEntries[day],
					hours: calculatedHours
				};
			}
		}

		setTimeEntries(newEntries);
		handleTimeEntryChange(newEntries).catch(console.error);
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

				<Card>
					<CardHeader>
						<CardTitle>Time Calculator</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="start-time" className="text-sm font-medium">
								Start Time
							</label>
							<Input
								id="start-time"
								type="time"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="end-time" className="text-sm font-medium">
								End Time
							</label>
							<Input
								id="end-time"
								type="time"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
							/>
						</div>

						<div className="pt-2 flex justify-between items-center">
							<p className="text-lg">
								Hours worked: {calculateHours(startTime, endTime).toFixed(2)}
							</p>
							<Button onClick={handleApplyTimeToWorkdays}>
								Apply to Workdays
							</Button>
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
