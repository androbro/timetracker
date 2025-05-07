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
import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

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
	const [deleteConfirm, setDeleteConfirm] = useState("");
	const deleteDataMutation = api.time.deleteAllUserData.useMutation({
		onSuccess: () => {
			toast.success("All your data has been deleted");
			setDeleteConfirm("");
			// Close the dialog after successful deletion
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(`Error deleting data: ${error.message}`);
		}
	});

	const handleSettingChange = <K extends keyof TimeSettings>(
		key: K,
		value: TimeSettings[K]
	) => {
		const newSettings = { ...settings, [key]: value };
		setSettings(newSettings);
		onSettingsChange(newSettings);
	};

	const handleDeleteData = () => {
		if (deleteConfirm === "delete") {
			deleteDataMutation.mutate();
		} else {
			toast.error("Please type 'delete' to confirm");
		}
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

					<div className="mt-8 pt-4 border-t">
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5 text-red-500" />
								<h3 className="text-base font-semibold text-red-500">
									Danger Zone
								</h3>
							</div>

							<div className="rounded-md border border-red-200 bg-red-50 p-4">
								<p className="text-sm font-medium text-red-800 mb-2">
									Delete all your data
								</p>
								<p className="text-xs text-red-700 mb-4">
									This action is irreversible. All your time entries, work
									weeks, and custom settings will be permanently deleted.
								</p>

								<div className="flex flex-col gap-2">
									<Label
										htmlFor="delete-confirm"
										className="text-xs font-medium text-red-700"
									>
										Type 'delete' to confirm
									</Label>
									<div className="flex gap-2">
										<Input
											id="delete-confirm"
											value={deleteConfirm}
											onChange={(e) => setDeleteConfirm(e.target.value)}
											className="border-red-300 focus:border-red-500 focus:ring-red-500"
											placeholder="Type 'delete'"
										/>
										<Button
											onClick={handleDeleteData}
											variant="destructive"
											disabled={
												deleteConfirm !== "delete" ||
												deleteDataMutation.isPending
											}
										>
											{deleteDataMutation.isPending ? "Deleting..." : "Delete"}
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
