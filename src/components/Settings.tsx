"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "./ui/select";
import { Label } from "./ui/label";

export interface DaySettings {
	defaultStartTime: string;
	defaultEndTime: string;
	defaultHours: number;
}

export interface TimeSettings {
	targetHours: number;
	breakDuration: number;
	defaultDaySettings: Record<string, DaySettings>;
}

interface SettingsProps {
	initialSettings: TimeSettings;
	onSettingsChange: (settings: TimeSettings) => void;
}

export function Settings({ initialSettings, onSettingsChange }: SettingsProps) {
	const [settings, setSettings] = useState<TimeSettings>(initialSettings);

	// Standard workdays to configure
	const workdays = [
		{ key: "monday", label: "Monday" },
		{ key: "tuesday", label: "Tuesday" },
		{ key: "wednesday", label: "Wednesday" },
		{ key: "thursday", label: "Thursday" },
		{ key: "friday", label: "Friday" }
	];

	const handleSettingChange = <K extends keyof TimeSettings>(
		key: K,
		value: TimeSettings[K]
	) => {
		const newSettings = { ...settings, [key]: value };
		setSettings(newSettings);
		onSettingsChange(newSettings);
	};

	const handleDaySettingChange = (
		day: string,
		field: keyof DaySettings,
		value: string | number
	) => {
		const newDaySettings = {
			...settings.defaultDaySettings,
			[day]: {
				...settings.defaultDaySettings[day],
				[field]: value
			}
		};

		const newSettings = {
			...settings,
			defaultDaySettings: newDaySettings
		};

		setSettings(newSettings);
		onSettingsChange(newSettings);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Settings</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="weekly-hours" className="text-sm font-medium">
							Weekly Target Hours
						</Label>
						<Select
							value={settings.targetHours.toString()}
							onValueChange={(value) =>
								handleSettingChange("targetHours", Number(value))
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
						<Label htmlFor="break-duration" className="text-sm font-medium">
							Break Duration (minutes)
						</Label>
						<Input
							id="break-duration"
							type="number"
							value={settings.breakDuration}
							onChange={(e) =>
								handleSettingChange("breakDuration", Number(e.target.value))
							}
						/>
					</div>
				</div>

				<div className="border-t pt-4">
					<h3 className="text-sm font-medium mb-4">Default Day Settings</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{workdays.map(({ key, label }) => (
							<Card key={key} className="border-dashed">
								<CardHeader className="p-3">
									<CardTitle className="text-sm">{label}</CardTitle>
								</CardHeader>
								<CardContent className="p-3 pt-0 space-y-2">
									<div className="grid grid-cols-2 gap-2">
										<div>
											<Label htmlFor={`${key}-start`} className="text-xs">
												Start Time
											</Label>
											<Input
												id={`${key}-start`}
												type="time"
												value={
													settings.defaultDaySettings[key]?.defaultStartTime ||
													"09:00"
												}
												onChange={(e) =>
													handleDaySettingChange(
														key,
														"defaultStartTime",
														e.target.value
													)
												}
											/>
										</div>
										<div>
											<Label htmlFor={`${key}-end`} className="text-xs">
												End Time
											</Label>
											<Input
												id={`${key}-end`}
												type="time"
												value={
													settings.defaultDaySettings[key]?.defaultEndTime ||
													"17:00"
												}
												onChange={(e) =>
													handleDaySettingChange(
														key,
														"defaultEndTime",
														e.target.value
													)
												}
											/>
										</div>
									</div>
									<div>
										<Label htmlFor={`${key}-hours`} className="text-xs">
											Default Hours
										</Label>
										<Input
											id={`${key}-hours`}
											type="number"
											min="0"
											max="24"
											step="0.25"
											value={
												settings.defaultDaySettings[key]?.defaultHours || 8
											}
											onChange={(e) =>
												handleDaySettingChange(
													key,
													"defaultHours",
													Number(e.target.value)
												)
											}
										/>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
