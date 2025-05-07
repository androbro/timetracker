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
		monday: { hours: 0, isDayOff: false },
		tuesday: { hours: 0, isDayOff: false },
		wednesday: { hours: 0, isDayOff: false },
		thursday: { hours: 0, isDayOff: false },
		friday: { hours: 0, isDayOff: false },
		saturday: { hours: 0, isDayOff: true },
		sunday: { hours: 0, isDayOff: true }
	};

	// State for editing day settings
	const [editingDay, setEditingDay] = useState<string | null>(null);
	const [tempDaySettings, setTempDaySettings] = useState<DaySettings | null>(
		null
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Function to merge initial entries with defaults
	const mergeEntries = useCallback(() => {
		// Start with default days
		const merged = { ...defaultDays };

		// Process initial entries and merge them
		for (const [day, entry] of Object.entries(initialEntries)) {
			if (entry && day in defaultDays) {
				// Safe to cast since we've checked day is in defaultDays
				const dayKey = day as DayKey;
				const defaultEntry = defaultDays[dayKey];

				merged[dayKey] = {
					hours:
						typeof entry.hours === "number" ? entry.hours : defaultEntry.hours,
					isDayOff:
						typeof entry.isDayOff === "boolean"
							? entry.isDayOff
							: defaultEntry.isDayOff
				};
			}
		}

		return merged;
	}, [initialEntries]);

	const [timeEntries, setTimeEntries] = useState<Record<string, TimeEntry>>(
		() => mergeEntries()
	);

	// Update timeEntries when initialEntries changes
	useEffect(() => {
		setTimeEntries(mergeEntries());
	}, [mergeEntries]);

	const handleHoursChange = (day: string, value: string) => {
		// Parse the input as a float to support decimal hours (like 1.5 for 1h 30m)
		const hours = Number.parseFloat(value) || 0;
		const newEntries: Record<string, TimeEntry> = { ...timeEntries };

		// Ensure we have a valid entry for this day before updating
		if (timeEntries[day]) {
			newEntries[day] = {
				...timeEntries[day],
				hours
			};
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

	// Fill in default hours for all workdays based on settings
	const applyDefaultHours = () => {
		const newEntries = { ...timeEntries };

		for (const { key } of days) {
			// Skip days off and weekend days
			if (newEntries[key]?.isDayOff) {
				continue;
			}

			// Use day-specific default hours if available, otherwise use 8 hours as fallback
			const daySetting = defaultDaySettings[key];
			if (daySetting) {
				const defaultHours = daySetting.defaultHours ?? 8;

				newEntries[key] = {
					...newEntries[key],
					hours: defaultHours,
					isDayOff: newEntries[key]?.isDayOff || false
				};
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
									Total: {totalHoursWorked.toFixed(2)} hrs
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
									Remaining: {remainingHours.toFixed(2)} hrs
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
											<p>Apply default hours to workdays</p>
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

									<Input
										id={`${key}-hours`}
										type="number"
										min="0"
										max="24"
										step="0.25"
										value={entry?.hours || 0}
										onChange={(e) => handleHoursChange(key, e.target.value)}
										className="w-full text-center"
										placeholder="0"
										disabled={!!isDisabled}
									/>

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
