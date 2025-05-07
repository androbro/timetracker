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
import type { DaySettings } from "./Settings";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "~/components/ui/dialog";

interface TimeEntry {
	hours: number;
	isDayOff: boolean;
	startTime: string;
	endTime: string;
	lunchBreakHours: number;
}

interface WeeklyTimeEntryProps {
	onTimeEntryChange?: (
		entries: Record<string, TimeEntry>,
		changedDay?: string
	) => void;
	initialEntries?: Partial<Record<string, Partial<TimeEntry>>>;
	targetHours: number;
	defaultDaySettings: Record<string, DaySettings>;
	onDaySettingsChange?: (day: string, settings: DaySettings) => void;
}

// Define day keys type for better type safety
type DayKey =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday";

export function WeeklyTimeEntry({
	onTimeEntryChange,
	initialEntries = {},
	targetHours,
	defaultDaySettings,
	onDaySettingsChange
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
	const [tempDaySettings, setTempDaySettings] = useState<DaySettings | null>(
		null
	);
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

	// Calculate hours based on start time, end time, and lunch break
	const calculateHours = (
		startTime: string,
		endTime: string,
		lunchBreakHours: number
	) => {
		if (!startTime || !endTime) return 0;

		const startParts = startTime.split(":").map(Number);
		const endParts = endTime.split(":").map(Number);

		if (startParts.length < 2 || endParts.length < 2) return 0;

		const startHour = startParts[0] || 0;
		const startMinute = startParts[1] || 0;
		const endHour = endParts[0] || 0;
		const endMinute = endParts[1] || 0;

		const startMinutes = startHour * 60 + startMinute;
		const endMinutes = endHour * 60 + endMinute;

		// Calculate total work minutes and subtract lunch break
		const workMinutes = endMinutes - startMinutes - lunchBreakHours * 60;

		// Convert back to hours with decimal
		return Math.max(0, workMinutes / 60);
	};

	// Format hours to display in a more readable way (e.g., 7h 30m)
	const formatHours = (hours: number) => {
		const wholeHours = Math.floor(hours);
		const minutes = Math.round((hours - wholeHours) * 60);

		if (minutes === 0) {
			return `${wholeHours}h`;
		}
		return `${wholeHours}h ${minutes}m`;
	};

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

	const days = [
		{ key: "monday", label: "Monday" },
		{ key: "tuesday", label: "Tuesday" },
		{ key: "wednesday", label: "Wednesday" },
		{ key: "thursday", label: "Thursday" },
		{ key: "friday", label: "Friday" },
		{ key: "saturday", label: "Saturday" },
		{ key: "sunday", label: "Sunday" }
	] as const;

	// Apply default hours for all workdays based on settings
	const applyDefaultHours = () => {
		const newEntries = { ...timeEntries };

		for (const { key } of days) {
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

		// Calculate hours to add per day
		const hoursPerDay = remainingHours / workdayCount;

		// Create new entries with adjusted hours
		const newEntries = { ...timeEntries };
		for (const day of Object.keys(newEntries)) {
			if (newEntries[day] && !newEntries[day].isDayOff) {
				newEntries[day] = {
					...newEntries[day],
					hours: newEntries[day].hours + hoursPerDay,
					isDayOff: newEntries[day].isDayOff
				};
			}
		}

		setTimeEntries(newEntries);
		onTimeEntryChange?.(newEntries);
	};

	// Handle day settings changes
	const handleDaySettingChange = (
		field: keyof DaySettings,
		value: string | number
	) => {
		if (!editingDay || !tempDaySettings) return;

		setTempDaySettings({
			...tempDaySettings,
			[field]: value
		});
	};

	// Save day settings changes
	const saveDaySettings = () => {
		if (!editingDay || !tempDaySettings || !onDaySettingsChange) return;

		// Ensure all properties are properly defined before saving
		const safeSettings: DaySettings = {
			defaultStartTime: tempDaySettings.defaultStartTime || "09:00",
			defaultEndTime: tempDaySettings.defaultEndTime || "17:00",
			defaultHours: tempDaySettings.defaultHours ?? 8
		};

		onDaySettingsChange(editingDay, safeSettings);
		setIsDialogOpen(false);
		setEditingDay(null);
		setTempDaySettings(null);
	};

	// Open day settings dialog
	const openDaySettings = (day: string) => {
		// Create a fully defined default settings object
		const defaultSettings: DaySettings = {
			defaultStartTime: "09:00",
			defaultEndTime: "17:00",
			defaultHours: 8
		};

		// Get existing settings or use defaults
		const settings = defaultDaySettings[day] || defaultSettings;

		// Make sure all fields are defined, even if the original object had undefined values
		const fullSettings: DaySettings = {
			defaultStartTime:
				settings.defaultStartTime || defaultSettings.defaultStartTime,
			defaultEndTime: settings.defaultEndTime || defaultSettings.defaultEndTime,
			defaultHours: settings.defaultHours ?? defaultSettings.defaultHours
		};

		setEditingDay(day);
		setTempDaySettings(fullSettings);
		setIsDialogOpen(true);
	};

	// Calculate total hours worked and remaining hours
	const totalHoursWorked = Object.values(timeEntries).reduce(
		(sum, entry) => (entry.isDayOff ? sum : sum + entry.hours),
		0
	);
	const remainingHours = targetHours - totalHoursWorked;

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex justify-between items-center">
						<span>Weekly Time Entries</span>
						<div className="flex gap-2 items-center">
							<div className="text-lg flex gap-4 items-center">
								<span className="text-sm font-normal">
									Total: {formatHours(totalHoursWorked)}
								</span>
								<span
									className={`text-sm font-normal ${
										remainingHours < 0
											? "text-red-500"
											: remainingHours === 0
											? "text-green-500"
											: ""
									}`}
								>
									Remaining: {formatHours(Math.abs(remainingHours))}
								</span>
							</div>
							<div className="flex gap-2">
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="icon"
												onClick={applyDefaultHours}
											>
												<Clock className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Apply default times to workdays</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="icon"
												onClick={fillTargetHours}
											>
												<Clock className="h-4 w-4 font-bold" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>
												Fill remaining hours to meet target ({targetHours} hrs)
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-7 gap-4">
						{days.map(({ key, label }) => {
							const entry = timeEntries[key];
							const isDisabled = entry?.isDayOff;
							const daySettings = defaultDaySettings[key];

							return (
								<div
									key={key}
									className={`flex flex-col items-center space-y-2 p-3 rounded-md ${
										isDisabled ? "bg-gray-100 dark:bg-gray-800" : ""
									}`}
								>
									<div className="flex justify-between items-center w-full">
										<Label htmlFor={`${key}-hours`}>{label}</Label>
										<Dialog
											open={isDialogOpen && editingDay === key}
											onOpenChange={(open) => {
												setIsDialogOpen(open);
												if (!open) {
													setEditingDay(null);
													setTempDaySettings(null);
												}
											}}
										>
											<DialogTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													onClick={() => openDaySettings(key)}
												>
													<SettingsIcon className="h-3.5 w-3.5" />
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Settings for {label}</DialogTitle>
												</DialogHeader>
												{tempDaySettings && (
													<div className="space-y-4 py-4">
														<div className="grid grid-cols-2 gap-4">
															<div className="space-y-2">
																<Label htmlFor={`${key}-default-start`}>
																	Default Start Time
																</Label>
																<Input
																	id={`${key}-default-start`}
																	type="time"
																	value={tempDaySettings.defaultStartTime}
																	onChange={(e) =>
																		handleDaySettingChange(
																			"defaultStartTime",
																			e.target.value
																		)
																	}
																/>
															</div>
															<div className="space-y-2">
																<Label htmlFor={`${key}-default-end`}>
																	Default End Time
																</Label>
																<Input
																	id={`${key}-default-end`}
																	type="time"
																	value={tempDaySettings.defaultEndTime}
																	onChange={(e) =>
																		handleDaySettingChange(
																			"defaultEndTime",
																			e.target.value
																		)
																	}
																/>
															</div>
														</div>
														<div className="space-y-2">
															<Label htmlFor={`${key}-default-hours`}>
																Default Hours
															</Label>
															<Input
																id={`${key}-default-hours`}
																type="number"
																min="0"
																max="24"
																step="0.25"
																value={tempDaySettings.defaultHours}
																onChange={(e) =>
																	handleDaySettingChange(
																		"defaultHours",
																		Number(e.target.value)
																	)
																}
															/>
														</div>
														<div className="flex justify-end">
															<Button onClick={saveDaySettings}>Save</Button>
														</div>
													</div>
												)}
											</DialogContent>
										</Dialog>
									</div>

									{!isDisabled && (
										<div className="w-full space-y-2">
											<div className="grid grid-cols-2 gap-2">
												<div>
													<Label htmlFor={`${key}-start`} className="text-xs">
														Start
													</Label>
													<Input
														id={`${key}-start`}
														type="time"
														value={entry?.startTime || ""}
														onChange={(e) =>
															handleTimeChange(key, "startTime", e.target.value)
														}
														className="w-full text-center"
														disabled={isDisabled}
													/>
												</div>
												<div>
													<Label htmlFor={`${key}-end`} className="text-xs">
														End
													</Label>
													<Input
														id={`${key}-end`}
														type="time"
														value={entry?.endTime || ""}
														onChange={(e) =>
															handleTimeChange(key, "endTime", e.target.value)
														}
														className="w-full text-center"
														disabled={isDisabled}
													/>
												</div>
											</div>

											<div>
												<Label htmlFor={`${key}-lunch`} className="text-xs">
													Lunch (hours)
												</Label>
												<Input
													id={`${key}-lunch`}
													type="number"
													min="0"
													max="5"
													step="0.25"
													value={entry?.lunchBreakHours || 0}
													onChange={(e) =>
														handleLunchBreakChange(key, e.target.value)
													}
													className="w-full text-center"
													disabled={isDisabled}
												/>
											</div>

											<div className="text-sm font-medium text-center mt-2">
												{formatHours(entry?.hours || 0)}
											</div>
										</div>
									)}

									<div className="flex items-center justify-between w-full pt-2">
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex items-center gap-1">
														<Label
															htmlFor={`${key}-dayoff`}
															className="text-xs"
														>
															Day Off
														</Label>
														<Info className="h-3 w-3" />
													</div>
												</TooltipTrigger>
												<TooltipContent>
													<p className="text-xs">
														Mark as regular day off (weekend, etc.)
													</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										<Switch
											id={`${key}-dayoff`}
											checked={entry?.isDayOff || false}
											onCheckedChange={(checked: boolean) =>
												handleDayOffToggle(key, checked)
											}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</>
	);
}
