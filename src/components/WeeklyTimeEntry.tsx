"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "~/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from "~/components/ui/tooltip";
import { Info, Settings as SettingsIcon, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "~/lib/utils";
import type { DaySettings } from "./Settings";

// Import extracted components and utilities
import { TimeInput } from "./TimeInput";
import { DaySettingsDialog } from "./DaySettingsDialog";
import { calculateHours, formatHours } from "./utils/timeUtils";
import {
	type TimeEntry,
	type WeeklyTimeEntryProps,
	type DayKey,
	DAYS
} from "./types/timeEntryTypes";

export function WeeklyTimeEntry({
	onTimeEntryChange,
	initialEntries = {},
	targetHours,
	defaultDaySettings,
	onDaySettingsChange,
	use24HourFormat = true,
	showWeekends = true,
	onOpenSettings
}: WeeklyTimeEntryProps) {
	const defaultDays: Record<DayKey, TimeEntry> = {
		monday: {
			hours: 0,
			isDayOff: false,
			startTime: "09:00",
			endTime: "17:00",
			lunchBreakHours: 0.5
		},
		tuesday: {
			hours: 0,
			isDayOff: false,
			startTime: "09:00",
			endTime: "17:00",
			lunchBreakHours: 0.5
		},
		wednesday: {
			hours: 0,
			isDayOff: false,
			startTime: "09:00",
			endTime: "17:00",
			lunchBreakHours: 0.5
		},
		thursday: {
			hours: 0,
			isDayOff: false,
			startTime: "09:00",
			endTime: "17:00",
			lunchBreakHours: 0.5
		},
		friday: {
			hours: 0,
			isDayOff: false,
			startTime: "09:00",
			endTime: "17:00",
			lunchBreakHours: 0.5
		},
		saturday: {
			hours: 0,
			isDayOff: true,
			startTime: "09:00",
			endTime: "17:00",
			lunchBreakHours: 0.5
		},
		sunday: {
			hours: 0,
			isDayOff: true,
			startTime: "09:00",
			endTime: "17:00",
			lunchBreakHours: 0.5
		}
	};

	// State for editing day settings
	const [editingDay, setEditingDay] = useState<string | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Function to merge initial entries with defaults and apply day settings
	const mergeEntries = useCallback(() => {
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
				merged[dayKey].hours = calculateHours(
					merged[dayKey].startTime,
					merged[dayKey].endTime,
					merged[dayKey].lunchBreakHours
				);
			}
		}

		// Process initial entries and merge them
		for (const [day, entry] of Object.entries(initialEntries)) {
			if (entry && day in defaultDays) {
				// Safe to cast since we've checked day is in defaultDays
				const dayKey = day as DayKey;
				const defaultEntry = merged[dayKey];

				merged[dayKey] = {
					hours:
						typeof entry.hours === "number" ? entry.hours : defaultEntry.hours,
					isDayOff:
						typeof entry.isDayOff === "boolean"
							? entry.isDayOff
							: defaultEntry.isDayOff,
					startTime: entry.startTime || defaultEntry.startTime,
					endTime: entry.endTime || defaultEntry.endTime,
					lunchBreakHours: entry.lunchBreakHours || defaultEntry.lunchBreakHours
				};
			}
		}

		return merged;
	}, [initialEntries, defaultDaySettings]);

	const [timeEntries, setTimeEntries] = useState<Record<string, TimeEntry>>(
		() => mergeEntries()
	);

	// Update timeEntries when initialEntries changes
	useEffect(() => {
		setTimeEntries(mergeEntries());
	}, [mergeEntries]);

	const handleTimeChange = (
		day: string,
		field: "startTime" | "endTime",
		value: string
	) => {
		const newEntries: Record<string, TimeEntry> = { ...timeEntries };

		if (newEntries[day]) {
			const currentEntry = newEntries[day];
			const updatedEntry: TimeEntry = {
				hours: currentEntry.hours,
				isDayOff: currentEntry.isDayOff,
				startTime: currentEntry.startTime,
				endTime: currentEntry.endTime,
				lunchBreakHours: currentEntry.lunchBreakHours,
				...{ [field]: value }
			};

			// Recalculate hours based on start time, end time and lunch break
			updatedEntry.hours = calculateHours(
				updatedEntry.startTime,
				updatedEntry.endTime,
				updatedEntry.lunchBreakHours
			);

			newEntries[day] = updatedEntry;
		}

		setTimeEntries(newEntries);
		onTimeEntryChange?.(newEntries, day);
	};

	const handleLunchBreakChange = (day: string, value: string) => {
		const lunchBreakHours = Number.parseFloat(value) || 0;
		const newEntries: Record<string, TimeEntry> = { ...timeEntries };

		if (newEntries[day]) {
			const currentEntry = newEntries[day];
			const updatedEntry: TimeEntry = {
				hours: currentEntry.hours,
				isDayOff: currentEntry.isDayOff,
				startTime: currentEntry.startTime,
				endTime: currentEntry.endTime,
				lunchBreakHours: lunchBreakHours
			};

			// Recalculate hours
			updatedEntry.hours = calculateHours(
				updatedEntry.startTime,
				updatedEntry.endTime,
				updatedEntry.lunchBreakHours
			);

			newEntries[day] = updatedEntry;
		}

		setTimeEntries(newEntries);
		onTimeEntryChange?.(newEntries, day);
	};

	const handleDayOffToggle = (day: string, isDayOff: boolean) => {
		const newEntries: Record<string, TimeEntry> = { ...timeEntries };

		// Ensure we have a valid entry for this day before updating
		if (timeEntries[day]) {
			newEntries[day] = {
				...timeEntries[day],
				isDayOff,
				// If marking as day off, reset hours to 0
				hours: isDayOff ? 0 : timeEntries[day].hours
			};
		}

		setTimeEntries(newEntries);
		onTimeEntryChange?.(newEntries, day);
	};

	// Apply default hours for all workdays based on settings
	const applyDefaultHours = () => {
		const newEntries = { ...timeEntries };

		for (const { key } of DAYS) {
			// Skip days off
			if (newEntries[key]?.isDayOff) {
				continue;
			}

			// Use day-specific default settings if available
			const daySetting = defaultDaySettings[key];
			if (daySetting && newEntries[key]) {
				const currentEntry = newEntries[key];
				newEntries[key] = {
					...currentEntry,
					startTime: daySetting.defaultStartTime || currentEntry.startTime,
					endTime: daySetting.defaultEndTime || currentEntry.endTime,
					isDayOff: currentEntry.isDayOff
				};

				// Recalculate hours
				if (newEntries[key]) {
					newEntries[key].hours = calculateHours(
						newEntries[key].startTime,
						newEntries[key].endTime,
						newEntries[key].lunchBreakHours
					);
				}
			}
		}

		setTimeEntries(newEntries);
		onTimeEntryChange?.(newEntries);
	};

	// Fill hours to meet target hours
	const fillTargetHours = () => {
		// Calculate current total hours
		const currentTotal = Object.values(timeEntries).reduce(
			(sum, entry) => (entry.isDayOff ? sum : sum + entry.hours),
			0
		);

		// If we already met or exceeded target, no need to adjust
		if (currentTotal >= targetHours) {
			return;
		}

		// Calculate remaining hours needed
		const remainingHours = targetHours - currentTotal;

		// Count how many workdays we have
		const workdayCount = Object.values(timeEntries).filter(
			(entry) => !entry.isDayOff
		).length;

		if (workdayCount === 0) {
			return; // No workdays to distribute hours to
		}

		// Distribute remaining hours evenly among workdays
		const hoursPerDay = remainingHours / workdayCount;
		const newEntries = { ...timeEntries };

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
				entry.lunchBreakHours
			);
		}

		setTimeEntries(newEntries);
		onTimeEntryChange?.(newEntries);
	};

	// Open day settings dialog
	const openDaySettings = (day: string) => {
		setEditingDay(day);
		setIsDialogOpen(true);
	};

	// Save day settings
	const saveDaySettings = (settings: DaySettings) => {
		if (editingDay && settings) {
			onDaySettingsChange?.(editingDay, settings);
			setIsDialogOpen(false);
			setEditingDay(null);
		}
	};

	// Calculate total hours
	const totalHours = Object.values(timeEntries).reduce(
		(sum, entry) => sum + entry.hours,
		0
	);

	// Format for target vs. actual hours display
	const hoursDisplay = `${formatHours(totalHours)} / ${formatHours(
		targetHours
	)}`;
	const hoursPercentage = (totalHours / targetHours) * 100;
	const isOverTarget = totalHours > targetHours;

	// Filter days based on showWeekends prop
	const visibleDays = DAYS.filter(
		({ key }) => showWeekends || (key !== "saturday" && key !== "sunday")
	);

	return (
		<>
			<Card className="mb-8">
				<CardHeader className="pb-2">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
						<CardTitle className="text-xl mb-2 sm:mb-0">Weekly Hours</CardTitle>
						<div className="flex space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={applyDefaultHours}
								className="h-8 text-xs"
							>
								Apply Default Hours
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={fillTargetHours}
								className="h-8 text-xs"
							>
								Fill Target Hours
							</Button>
							{onOpenSettings && (
								<Button
									variant="outline"
									size="sm"
									onClick={onOpenSettings}
									className="h-8 text-xs flex items-center gap-1"
								>
									<SettingsIcon className="h-3 w-3" />
									Settings
								</Button>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{/* Target hours display */}
						<div className="flex flex-col">
							<div className="flex justify-between mb-1">
								<span className="text-sm font-medium">Target vs. Actual</span>
								<span
									className={cn(
										"text-sm",
										isOverTarget ? "text-green-600" : "text-gray-600"
									)}
								>
									{hoursDisplay}
								</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
								<div
									className={cn(
										"h-2.5 rounded-full",
										isOverTarget
											? "bg-green-600"
											: hoursPercentage >= 100
											? "bg-green-600"
											: hoursPercentage >= 90
											? "bg-yellow-400"
											: "bg-indigo-600"
									)}
									style={{
										width: `${Math.min(hoursPercentage, 100)}%`
									}}
								/>
							</div>
						</div>

						{/* Day entries - Horizontal layout */}
						<div
							className={cn(
								"grid grid-cols-1 gap-4",
								showWeekends ? "md:grid-cols-7" : "md:grid-cols-5"
							)}
						>
							{visibleDays.map(({ key, label }) => (
								<div key={key} className="border rounded-md p-3">
									<div className="flex flex-col mb-3">
										<div className="flex items-center justify-between mb-2">
											<h3 className="font-semibold">{label}</h3>
											<span
												className={cn(
													"text-sm font-semibold",
													timeEntries[key]?.isDayOff
														? "text-gray-400"
														: "text-indigo-600 dark:text-indigo-400"
												)}
											>
												{formatHours(timeEntries[key]?.hours || 0)}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<div className="inline-flex items-center">
												<Switch
													id={`day-off-${key}`}
													checked={timeEntries[key]?.isDayOff || false}
													onCheckedChange={(checked) =>
														handleDayOffToggle(key, checked)
													}
													className="mr-2"
												/>
												<Label htmlFor={`day-off-${key}`} className="text-sm">
													Day Off
												</Label>
											</div>
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
															onClick={() => openDaySettings(key)}
														>
															<SettingsIcon className="h-4 w-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>Day settings</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</div>
									</div>

									<div
										className={cn(
											"flex flex-col gap-2",
											timeEntries[key]?.isDayOff &&
												"opacity-50 pointer-events-none"
										)}
									>
										<TimeInput
											label="Start Time"
											value={timeEntries[key]?.startTime || ""}
											onChange={(value) =>
												handleTimeChange(key, "startTime", value)
											}
											disabled={timeEntries[key]?.isDayOff}
											use24HourFormat={use24HourFormat}
										/>
										<TimeInput
											label="End Time"
											value={timeEntries[key]?.endTime || ""}
											onChange={(value) =>
												handleTimeChange(key, "endTime", value)
											}
											disabled={timeEntries[key]?.isDayOff}
											use24HourFormat={use24HourFormat}
										/>

										<div className="space-y-1">
											<Label htmlFor={`lunch-${key}`} className="text-xs">
												Lunch Break (hours)
											</Label>
											<div className="relative">
												<Input
													type="number"
													id={`lunch-${key}`}
													value={timeEntries[key]?.lunchBreakHours || 0}
													onChange={(e) =>
														handleLunchBreakChange(key, e.target.value)
													}
													step="0.25"
													min="0"
													max="8"
													disabled={timeEntries[key]?.isDayOff}
													className="pr-10"
												/>
												<div className="absolute inset-y-0 right-0 flex items-center pr-2">
													<Clock
														className="h-4 w-4 text-gray-400"
														aria-hidden="true"
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Day settings dialog */}
			{editingDay && (
				<DaySettingsDialog
					isOpen={isDialogOpen}
					onClose={() => {
						setIsDialogOpen(false);
						setEditingDay(null);
					}}
					day={editingDay}
					daySettings={
						defaultDaySettings[editingDay] || {
							defaultStartTime: "09:00",
							defaultEndTime: "17:00",
							defaultHours: 8
						}
					}
					onSave={saveDaySettings}
					use24HourFormat={use24HourFormat}
				/>
			)}
		</>
	);
}
