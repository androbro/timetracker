"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "./ui/select";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

export interface DaySettings {
	defaultStartTime: string;
	defaultEndTime: string;
	defaultHours: number;
}

export interface TimeSettings {
	targetHours: number;
	breakDuration: number;
	defaultDaySettings: Record<string, DaySettings>;
	use24HourFormat: boolean;
	showWeekends: boolean;
}

interface SettingsProps {
	initialSettings: TimeSettings;
	onSettingsChange: (settings: TimeSettings) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function Settings({
	initialSettings,
	onSettingsChange,
	open,
	onOpenChange
}: SettingsProps) {
	const [settings, setSettings] = useState<TimeSettings>(initialSettings);

	const handleSettingChange = <K extends keyof TimeSettings>(
		key: K,
		value: TimeSettings[K]
	) => {
		const newSettings = { ...settings, [key]: value };
		setSettings(newSettings);
		onSettingsChange(newSettings);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
				</DialogHeader>
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

					<div className="space-y-2">
						<Label htmlFor="time-format" className="text-sm font-medium">
							Time Format
						</Label>
						<Select
							value={settings.use24HourFormat ? "24h" : "12h"}
							onValueChange={(value) =>
								handleSettingChange("use24HourFormat", value === "24h")
							}
						>
							<SelectTrigger id="time-format">
								<SelectValue placeholder="Select time format" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="24h">24-hour format (14:00)</SelectItem>
								<SelectItem value="12h">12-hour format (2:00 PM)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<div className="flex items-center space-x-2">
							<Switch
								id="show-weekends"
								checked={settings.showWeekends}
								onCheckedChange={(checked) =>
									handleSettingChange("showWeekends", checked)
								}
							/>
							<Label
								htmlFor="show-weekends"
								className="text-sm font-medium cursor-pointer"
							>
								Show Weekends by Default
							</Label>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
