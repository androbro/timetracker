"use client";

import { useState, useEffect } from "react";
import { TimeInput } from "./TimeInput";
import type { DaySettings } from "./Settings";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "~/components/ui/dialog";
import { Button } from "./ui/button";

interface DaySettingsDialogProps {
	isOpen: boolean;
	onClose: () => void;
	day: string;
	daySettings: DaySettings;
	onSave: (settings: DaySettings) => void;
	use24HourFormat?: boolean;
}

export function DaySettingsDialog({
	isOpen,
	onClose,
	day,
	daySettings,
	onSave,
	use24HourFormat = true
}: DaySettingsDialogProps) {
	const [tempSettings, setTempSettings] = useState<DaySettings>(daySettings);

	// Reset temp settings when dialog opens with new day
	useEffect(() => {
		if (isOpen && daySettings) {
			setTempSettings({ ...daySettings });
		}
	}, [isOpen, daySettings]);

	const handleSettingChange = (
		field: keyof DaySettings,
		value: string | number
	) => {
		setTempSettings((prev) => ({
			...prev,
			[field]: value
		}));
	};

	const handleSave = () => {
		onSave(tempSettings);
		onClose();
	};

	if (!day) return null;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="capitalize">
						{day.charAt(0).toUpperCase() + day.slice(1)} Settings
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 pt-4">
					<div className="grid grid-cols-2 gap-4">
						<TimeInput
							label="Default Start Time"
							value={tempSettings.defaultStartTime || "09:00"}
							onChange={(value) =>
								handleSettingChange("defaultStartTime", value)
							}
							use24HourFormat={use24HourFormat}
						/>
						<TimeInput
							label="Default End Time"
							value={tempSettings.defaultEndTime || "17:00"}
							onChange={(value) => handleSettingChange("defaultEndTime", value)}
							use24HourFormat={use24HourFormat}
						/>
					</div>

					<div className="mt-4 border-t pt-4">
						<h3 className="mb-2 text-sm font-medium">Office Hours</h3>
						<div className="grid grid-cols-2 gap-4">
							<TimeInput
								label="Office Hours Start"
								value={tempSettings.officeHoursStart || "09:00"}
								onChange={(value) =>
									handleSettingChange("officeHoursStart", value)
								}
								use24HourFormat={use24HourFormat}
							/>
							<TimeInput
								label="Office Hours End"
								value={tempSettings.officeHoursEnd || "17:00"}
								onChange={(value) => handleSettingChange("officeHoursEnd", value)}
								use24HourFormat={use24HourFormat}
							/>
						</div>
					</div>

					<div className="flex justify-end space-x-2 pt-4">
						<Button
							variant="outline"
							onClick={onClose}
							className="rounded-md px-4 py-2 text-sm font-medium"
						>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={handleSave}
							className="rounded-md px-4 py-2 text-sm font-medium"
						>
							Save
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
