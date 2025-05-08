"use client";

import { Clock, Info, Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Switch } from "~/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useDaySettingsDialog } from "~/lib/hooks/useDaySettingsDialog";
import { useTimeUtils } from "~/lib/hooks/useTimeUtils";
import { useWeeklyTimeEntryState } from "~/lib/hooks/useWeeklyTimeEntryState";
import { cn } from "~/lib/utils";
import type { DaySettings } from "./Settings";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import { DaySettingsDialog } from "./DaySettingsDialog";
// Import extracted components and utilities
import { TimeInput } from "./TimeInput";
import {
	DAYS,
	type DayKey,
	type TimeEntry,
	type WeeklyTimeEntryProps,
} from "./types/timeEntryTypes";

export function WeeklyTimeEntry({
	onTimeEntryChange,
	initialEntries = {},
	targetHours,
	defaultDaySettings,
	onDaySettingsChange,
	use24HourFormat = true,
	showWeekends = true,
	onOpenSettings,
}: WeeklyTimeEntryProps) {
	// Use the extracted hooks
	const { formatHours } = useTimeUtils();

	const {
		timeEntries,
		totalHours,
		handleTimeChange,
		handleLunchBreakChange,
		handleDayOffToggle,
		applyDefaultHours,
		fillTargetHours,
	} = useWeeklyTimeEntryState({
		initialEntries,
		defaultDaySettings,
		targetHours,
		onTimeEntryChange,
	});

	const {
		editingDay,
		isDialogOpen,
		openDaySettings,
		saveDaySettings,
		closeDialog,
	} = useDaySettingsDialog({
		onDaySettingsChange,
	});

	// Format for target vs. actual hours display
	const hoursDisplay = `${formatHours(totalHours)} / ${formatHours(
		targetHours,
	)}`;
	const hoursPercentage = (totalHours / targetHours) * 100;
	const isOverTarget = totalHours > targetHours;

	// Filter days based on showWeekends prop
	const visibleDays = DAYS.filter(
		({ key }) => showWeekends || (key !== "saturday" && key !== "sunday"),
	);

	return (
		<>
			<Card className="mb-8">
				<CardHeader className="pb-2">
					<div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
						<CardTitle className="mb-2 text-xl sm:mb-0">Weekly Hours</CardTitle>
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
									className="flex h-8 items-center gap-1 text-xs"
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
							<div className="mb-1 flex justify-between">
								<span className="font-medium text-sm">Target vs. Actual</span>
								<span
									className={cn(
										"text-sm",
										isOverTarget ? "text-green-600" : "text-gray-600",
									)}
								>
									{hoursDisplay}
								</span>
							</div>
							<div className="mb-4 h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
								<div
									className={cn(
										"h-2.5 rounded-full",
										isOverTarget
											? "bg-green-600"
											: hoursPercentage >= 100
												? "bg-green-600"
												: hoursPercentage >= 90
													? "bg-yellow-400"
													: "bg-indigo-600",
									)}
									style={{
										width: `${Math.min(hoursPercentage, 100)}%`,
									}}
								/>
							</div>
						</div>

						{/* Day entries - Horizontal layout */}
						<div
							className={cn(
								"grid grid-cols-1 gap-4",
								showWeekends ? "md:grid-cols-7" : "md:grid-cols-5",
							)}
						>
							{visibleDays.map(({ key, label }) => (
								<div key={key} className="rounded-md border p-3">
									<div className="mb-3 flex flex-col">
										<div className="mb-2 flex items-center justify-between">
											<h3 className="font-semibold">{label}</h3>
											<span
												className={cn(
													"font-semibold text-sm",
													timeEntries[key]?.isDayOff
														? "text-gray-400"
														: "text-indigo-600 dark:text-indigo-400",
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
												"pointer-events-none opacity-50",
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
					onClose={closeDialog}
					day={editingDay}
					daySettings={
						defaultDaySettings[editingDay] || {
							defaultStartTime: "09:00",
							defaultEndTime: "17:00",
							defaultHours: 8,
							officeHoursStart: "09:00",
							officeHoursEnd: "17:00",
						}
					}
					onSave={saveDaySettings}
					use24HourFormat={use24HourFormat}
				/>
			)}
		</>
	);
}
