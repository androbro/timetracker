import { useState } from "react";
import type { DaySettings } from "~/components/Settings";

interface UseDaySettingsDialogProps {
	onDaySettingsChange?: (day: string, settings: DaySettings) => void;
}

export function useDaySettingsDialog({
	onDaySettingsChange,
}: UseDaySettingsDialogProps) {
	// State for editing day settings
	const [editingDay, setEditingDay] = useState<string | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

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

	// Close dialog
	const closeDialog = () => {
		setIsDialogOpen(false);
		setEditingDay(null);
	};

	return {
		editingDay,
		isDialogOpen,
		openDaySettings,
		saveDaySettings,
		closeDialog,
	};
}
