"use client";

import { Clock, Info } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DaySettings } from "./Settings";
import { TimeInput } from "./TimeInput";
import { DAYS, type DayKey, type TimeEntry } from "./types/timeEntryTypes";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";
import {
	calculateHours,
	convertMinutesToTime,
	convertTimeToMinutes,
	formatHours,
} from "./utils/timeUtils";

interface EarlyDepartureSchedulerProps {
	timeEntries: Record<string, TimeEntry>;
	targetHours: number;
	daySettings: Record<string, DaySettings>;
	onTimeEntriesChange: (entries: Record<string, TimeEntry>) => void;
	use24HourFormat?: boolean;
	showWeekends?: boolean;
}

export function EarlyDepartureScheduler({
	timeEntries,
	targetHours,
	daySettings,
	onTimeEntriesChange,
	use24HourFormat = true,
	showWeekends = false,
}: EarlyDepartureSchedulerProps) {
	// State for the early departure day and time
	const [selectedDay, setSelectedDay] = useState<DayKey>("friday");
	const [departureTime, setDepartureTime] = useState("14:00");
	const [distributionStrategy, setDistributionStrategy] = useState<
		"equal" | "custom" | "early-start"
	>("equal");
	const [customDistribution, setCustomDistribution] = useState<
		Record<DayKey, number>
	>({} as Record<DayKey, number>);

	// Filter days for display (excluding weekends if not shown)
	const visibleDays = useMemo(() => {
		return DAYS.filter(
			({ key }) => showWeekends || (key !== "saturday" && key !== "sunday"),
		);
	}, [showWeekends]);

	// Calculate the current week's total working time and availability
	const {
		totalPlannedHours,
		totalRequiredHours,
		workDays,
		deficit,
		hoursBeforeDeparture,
		earlyDepartureDay,
	} = useMemo(() => {
		// Create a working copy of time entries
		const entries = { ...timeEntries };

		// Count total hours planned
		const totalPlannedHours = Object.values(entries).reduce(
			(sum, entry) => sum + (entry.isDayOff ? 0 : entry.hours),
			0,
		);

		// Calculate total required hours (subtracting days off from target)
		const daysOff = Object.values(entries).filter(
			(entry) => entry.isDayOff,
		).length;
		const workdaysPerWeek = visibleDays.length - daysOff;
		const totalRequiredHours = targetHours;

		// Get available work days (not marked as day off)
		const workDays = visibleDays
			.filter(({ key }) => !entries[key]?.isDayOff)
			.map(({ key }) => key as DayKey);

		// Calculate the departure day's current hours
		const selectedDayEntry = entries[selectedDay];
		let hoursBeforeDeparture = 0;

		if (selectedDayEntry && !selectedDayEntry.isDayOff) {
			const officeHoursStart =
				daySettings[selectedDay]?.officeHoursStart || "09:00";
			hoursBeforeDeparture = calculateHours(
				officeHoursStart,
				departureTime,
				selectedDayEntry.lunchBreakHours,
			);
		}

		// The early departure day as an object with key and label
		const earlyDepartureDay = DAYS.find((day) => day.key === selectedDay);

		// Calculate how much time needs to be made up
		const plannedHoursForSelectedDay = selectedDayEntry?.hours || 0;
		const defaultHoursForSelectedDay =
			daySettings[selectedDay]?.defaultHours || 8;

		// Deficit is the difference between planned/default hours and early departure hours
		const deficit = Math.max(
			0,
			defaultHoursForSelectedDay - hoursBeforeDeparture,
		);

		return {
			totalPlannedHours,
			totalRequiredHours,
			workDays,
			deficit,
			hoursBeforeDeparture,
			earlyDepartureDay,
		};
	}, [
		timeEntries,
		selectedDay,
		departureTime,
		daySettings,
		targetHours,
		visibleDays,
	]);

	// Memoize other work days to prevent unnecessary recalculations
	const otherWorkDays = useMemo(() => {
		return workDays.filter((day) => day !== selectedDay);
	}, [workDays, selectedDay]);

	// Initialize custom distribution when work days change
	useEffect(() => {
		if (distributionStrategy === "custom") {
			const distribution: Record<DayKey, number> = {} as Record<DayKey, number>;

			// Distribute deficit equally as a starting point
			const perDayExtra = deficit / Math.max(1, otherWorkDays.length);

			for (const day of otherWorkDays) {
				distribution[day] = perDayExtra;
			}

			setCustomDistribution(distribution);
		}
	}, [otherWorkDays, deficit, distributionStrategy]);

	// Calculate the adjusted time entries based on the selected strategy
	const calculateAdjustedEntries = useCallback(() => {
		const newEntries = { ...timeEntries };

		// Update the early departure day
		if (newEntries[selectedDay]) {
			const officeHoursStart =
				daySettings[selectedDay]?.officeHoursStart || "09:00";

			newEntries[selectedDay] = {
				...newEntries[selectedDay],
				startTime: newEntries[selectedDay]?.startTime || officeHoursStart,
				endTime: departureTime,
				hours: hoursBeforeDeparture,
			};
		}

		if (distributionStrategy === "equal" && otherWorkDays.length > 0) {
			// Distribute deficit equally among other work days
			const extraHoursPerDay = deficit / otherWorkDays.length;

			for (const day of otherWorkDays) {
				if (newEntries[day] && !newEntries[day].isDayOff) {
					const currentHours = newEntries[day].hours;
					const newHours = currentHours + extraHoursPerDay;

					// Calculate new end time based on additional hours
					const startTime = newEntries[day].startTime;
					const lunchBreak = newEntries[day].lunchBreakHours;

					// Convert hours to minutes for calculation
					const startMinutes = convertTimeToMinutes(startTime);
					const workMinutes = newHours * 60;
					const lunchMinutes = lunchBreak * 60;

					// Calculate new end time in minutes
					const endMinutes = startMinutes + workMinutes + lunchMinutes;
					const endTime = convertMinutesToTime(endMinutes);

					newEntries[day] = {
						...newEntries[day],
						endTime,
						hours: newHours,
					};
				}
			}
		} else if (distributionStrategy === "custom") {
			// Apply custom distribution
			for (const day of otherWorkDays) {
				if (
					newEntries[day] &&
					!newEntries[day].isDayOff &&
					customDistribution[day] !== undefined
				) {
					const currentHours = newEntries[day].hours;
					const newHours = currentHours + customDistribution[day];

					// Calculate new end time based on additional hours
					const startTime = newEntries[day].startTime;
					const lunchBreak = newEntries[day].lunchBreakHours;

					// Convert hours to minutes for calculation
					const startMinutes = convertTimeToMinutes(startTime);
					const workMinutes = newHours * 60;
					const lunchMinutes = lunchBreak * 60;

					// Calculate new end time in minutes
					const endMinutes = startMinutes + workMinutes + lunchMinutes;
					const endTime = convertMinutesToTime(endMinutes);

					newEntries[day] = {
						...newEntries[day],
						endTime,
						hours: newHours,
					};
				}
			}
		} else if (distributionStrategy === "early-start") {
			// Adjust start times for all work days to be earlier
			for (const day of otherWorkDays) {
				if (newEntries[day] && !newEntries[day].isDayOff) {
					const extraHoursPerDay = deficit / otherWorkDays.length;
					const currentHours = newEntries[day].hours;
					const newHours = currentHours + extraHoursPerDay;

					// Calculate new start time by moving it earlier
					const endTime = newEntries[day].endTime;
					const lunchBreak = newEntries[day].lunchBreakHours;

					// Convert hours to minutes for calculation
					const endMinutes = convertTimeToMinutes(endTime);
					const workMinutes = newHours * 60;
					const lunchMinutes = lunchBreak * 60;

					// Calculate new start time in minutes
					const startMinutes = endMinutes - workMinutes - lunchMinutes;
					const startTime = convertMinutesToTime(startMinutes);

					newEntries[day] = {
						...newEntries[day],
						startTime,
						hours: newHours,
					};
				}
			}
		}

		return newEntries;
	}, [
		timeEntries,
		selectedDay,
		daySettings,
		departureTime,
		hoursBeforeDeparture,
		distributionStrategy,
		otherWorkDays,
		deficit,
		customDistribution,
	]);

	// Apply the schedule changes
	const applySchedule = useCallback(() => {
		const adjustedEntries = calculateAdjustedEntries();
		onTimeEntriesChange(adjustedEntries);
	}, [calculateAdjustedEntries, onTimeEntriesChange]);

	// Handle custom distribution change
	const handleDistributionChange = useCallback((day: DayKey, value: number) => {
		setCustomDistribution((prev) => {
			// Only update if the value has changed
			if (prev[day] === value) return prev;
			return { ...prev, [day]: value };
		});
	}, []);

	// Handle the change of distribution strategy
	const handleStrategyChange = useCallback(
		(newStrategy: "equal" | "custom" | "early-start") => {
			if (distributionStrategy !== newStrategy) {
				setDistributionStrategy(newStrategy);
			}
		},
		[distributionStrategy],
	);

	// Handle day selection change
	const handleDayChange = useCallback((value: string) => {
		setSelectedDay(value as DayKey);
	}, []);

	// Handle departure time change
	const handleDepartureTimeChange = useCallback((value: string) => {
		setDepartureTime(value);
	}, []);

	// Memoize the filtered work days for the UI
	const nonDayOffDays = useMemo(() => {
		return visibleDays.filter(({ key }) => !timeEntries[key]?.isDayOff);
	}, [visibleDays, timeEntries]);

	// Memoize the total additional hours calculation
	const totalAdditionalHours = useMemo(() => {
		return Object.values(customDistribution).reduce((a, b) => a + b, 0);
	}, [customDistribution]);

	return (
		<Card className="mb-8">
			<CardHeader className="pb-2">
				<div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
					<CardTitle className="mb-2 text-xl sm:mb-0">
						Early Departure Planner
					</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					{/* Day and Time Selection */}
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="early-departure-day">Day to Leave Early</Label>
							<Select value={selectedDay} onValueChange={handleDayChange}>
								<SelectTrigger id="early-departure-day">
									<SelectValue placeholder="Select day" />
								</SelectTrigger>
								<SelectContent>
									{nonDayOffDays.map(({ key, label }) => (
										<SelectItem key={key} value={key}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="departure-time">Departure Time</Label>
							<TimeInput
								label="Departure Time"
								value={departureTime}
								onChange={handleDepartureTimeChange}
								use24HourFormat={use24HourFormat}
							/>
						</div>
					</div>

					{/* Summary */}
					<div className="space-y-3 rounded-md bg-muted p-4">
						<h3 className="font-medium text-sm">Schedule Summary</h3>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div>
								<p className="mb-1 text-muted-foreground text-xs">
									Target Hours
								</p>
								<p className="font-medium">{formatHours(totalRequiredHours)}</p>
							</div>

							<div>
								<p className="mb-1 text-muted-foreground text-xs">
									New Hours on {earlyDepartureDay?.label}
								</p>
								<div className="font-medium">
									{formatHours(hoursBeforeDeparture)}
									<Badge
										variant="outline"
										className="ml-2 border-amber-500 bg-amber-50 text-amber-500"
									>
										{formatHours(deficit)} deficit
									</Badge>
								</div>
							</div>

							<div>
								<p className="mb-1 text-muted-foreground text-xs">
									Work Days Available
								</p>
								<p className="font-medium">{workDays.length} days</p>
							</div>
						</div>
					</div>

					{/* Distribution Strategy */}
					<div className="space-y-3">
						<Label>Distribution Strategy</Label>
						<div className="grid grid-cols-1 gap-2 md:grid-cols-3">
							<Button
								variant={
									distributionStrategy === "equal" ? "default" : "outline"
								}
								onClick={() => handleStrategyChange("equal")}
								className="h-auto justify-start py-2 text-left"
								type="button"
							>
								<div className="flex flex-col items-start">
									<span>Equal Distribution</span>
									<span className="text-xs opacity-70">
										Spread hours evenly across other days
									</span>
								</div>
							</Button>

							<Button
								variant={
									distributionStrategy === "custom" ? "default" : "outline"
								}
								onClick={() => handleStrategyChange("custom")}
								className="h-auto justify-start py-2 text-left"
								type="button"
							>
								<div className="flex flex-col items-start">
									<span>Custom Distribution</span>
									<span className="text-xs opacity-70">
										Manually choose how to distribute hours
									</span>
								</div>
							</Button>

							<Button
								variant={
									distributionStrategy === "early-start" ? "default" : "outline"
								}
								onClick={() => handleStrategyChange("early-start")}
								className="h-auto justify-start py-2 text-left"
								type="button"
							>
								<div className="flex flex-col items-start">
									<span>Earlier Start Times</span>
									<span className="text-xs opacity-70">
										Start earlier each day to make up time
									</span>
								</div>
							</Button>
						</div>
					</div>

					{/* Custom Distribution Controls (only shown if custom is selected) */}
					{distributionStrategy === "custom" && (
						<div className="space-y-3 rounded-md border p-4">
							<h3 className="mb-4 font-medium text-sm">
								Custom Hour Distribution
							</h3>

							<div className="space-y-4">
								{otherWorkDays.map((day) => {
									const dayLabel = DAYS.find((d) => d.key === day)?.label;
									const currentHours = timeEntries[day]?.hours || 0;
									const extraHours = customDistribution[day] || 0;
									const totalHours = currentHours + extraHours;

									return (
										<div key={day} className="space-y-2">
											<div className="flex items-center justify-between">
												<Label
													htmlFor={`distribution-${day}`}
													className="text-sm"
												>
													{dayLabel}
												</Label>
												<div className="text-sm">
													<span className="font-medium">
														{formatHours(currentHours)}
													</span>
													<span className="mx-1">+</span>
													<span className="font-medium text-green-600">
														{formatHours(extraHours)}
													</span>
													<span className="mx-1">=</span>
													<span className="font-bold">
														{formatHours(totalHours)}
													</span>
												</div>
											</div>

											<div className="flex items-center gap-2">
												<Slider
													id={`distribution-${day}`}
													value={[extraHours]}
													min={0}
													max={Math.min(4, deficit)}
													step={0.25}
													onValueChange={(values) => {
														handleDistributionChange(
															day as DayKey,
															values[0] || 0,
														);
													}}
												/>
												<div className="w-16">
													<Input
														type="number"
														value={extraHours}
														onChange={(e) => {
															handleDistributionChange(
																day as DayKey,
																Math.min(
																	Number.parseFloat(e.target.value) || 0,
																	deficit,
																),
															);
														}}
														step={0.25}
														min={0}
														max={deficit}
														className="text-right"
													/>
												</div>
											</div>
										</div>
									);
								})}
							</div>

							<div className="mt-4 flex items-center justify-between border-t pt-3">
								<div className="font-medium text-sm">
									Total Additional Hours:
								</div>
								<div className="font-bold text-sm">
									{formatHours(totalAdditionalHours)}
									<span className="mx-1">of</span>
									{formatHours(deficit)}
								</div>
							</div>
						</div>
					)}

					{/* Office Hours Warning */}
					<TooltipProvider>
						<div className="flex items-center gap-1 text-amber-600 text-xs">
							<Info className="h-3 w-3" />
							<span>
								This planner respects your office hours settings. Make sure they
								are configured correctly.
							</span>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-5 w-5"
										type="button"
									>
										<Info className="h-3 w-3" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p className="max-w-60 text-xs">
										Office hours settings control when you're allowed to start
										and end your workday. You can adjust these in day settings.
									</p>
								</TooltipContent>
							</Tooltip>
						</div>
					</TooltipProvider>

					{/* Apply Changes Button */}
					<div className="flex justify-end">
						<Button onClick={applySchedule} className="gap-2" type="button">
							<Clock className="h-4 w-4" />
							Apply Schedule
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
