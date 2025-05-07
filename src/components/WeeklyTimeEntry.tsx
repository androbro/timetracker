"use client";

import { useState } from "react";
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
import { Info } from "lucide-react";

interface TimeEntry {
	hours: number;
	isDayOff: boolean;
}

interface WeeklyTimeEntryProps {
	onTimeEntryChange?: (entries: Record<string, TimeEntry>) => void;
	initialEntries?: Partial<Record<string, Partial<TimeEntry>>>;
	targetHours: number;
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
	targetHours
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

	// Initialize entries with defaults and merge with initial entries
	const initializedEntries: Record<string, TimeEntry> = { ...defaultDays };

	// Process initial entries and ensure all expected properties are present
	for (const [day, entry] of Object.entries(initialEntries)) {
		if (entry && day in defaultDays) {
			// Safe to cast since we've checked day is in defaultDays
			const dayKey = day as DayKey;
			const defaultEntry = defaultDays[dayKey];

			initializedEntries[day] = {
				// Provide default values if properties are not specified
				hours:
					typeof entry.hours === "number" ? entry.hours : defaultEntry.hours,
				isDayOff:
					typeof entry.isDayOff === "boolean"
						? entry.isDayOff
						: defaultEntry.isDayOff
			};
		}
	}

	const [timeEntries, setTimeEntries] =
		useState<Record<string, TimeEntry>>(initializedEntries);

	const handleHoursChange = (day: string, value: string) => {
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
		onTimeEntryChange?.(newEntries);
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
		onTimeEntryChange?.(newEntries);
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

	// Calculate total hours worked and remaining hours
	const totalHoursWorked = Object.values(timeEntries).reduce(
		(sum, entry) => (entry.isDayOff ? sum : sum + entry.hours),
		0
	);
	const remainingHours = targetHours - totalHoursWorked;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex justify-between items-center">
					<span>Weekly Time Entries</span>
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
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-7 gap-4">
					{days.map(({ key, label }) => {
						const entry = timeEntries[key];
						const isDisabled = entry?.isDayOff;

						return (
							<div
								key={key}
								className={`flex flex-col items-center space-y-2 p-3 rounded-md ${
									isDisabled ? "bg-gray-100 dark:bg-gray-800" : ""
								}`}
							>
								<Label htmlFor={`${key}-hours`}>{label}</Label>

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
													<Label htmlFor={`${key}-dayoff`} className="text-xs">
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
	);
}
