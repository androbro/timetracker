import { useEffect, useState } from "react";
import type { DaySettings, TimeSettings } from "~/components/Settings";
import { api } from "~/trpc/react";

/**
 * Default time settings with day-specific defaults
 */
export const defaultTimeSettings: TimeSettings = {
	targetHours: 40,
	breakDuration: 30,
	defaultDaySettings: {
		monday: {
			defaultStartTime: "09:00",
			defaultEndTime: "17:00",
			defaultHours: 8,
			officeHoursStart: "09:00",
			officeHoursEnd: "17:00",
		},
		tuesday: {
			defaultStartTime: "09:00",
			defaultEndTime: "17:00",
			defaultHours: 8,
			officeHoursStart: "09:00",
			officeHoursEnd: "17:00",
		},
		wednesday: {
			defaultStartTime: "09:00",
			defaultEndTime: "17:00",
			defaultHours: 8,
			officeHoursStart: "09:00",
			officeHoursEnd: "17:00",
		},
		thursday: {
			defaultStartTime: "09:00",
			defaultEndTime: "17:00",
			defaultHours: 8,
			officeHoursStart: "09:00",
			officeHoursEnd: "17:00",
		},
		friday: {
			defaultStartTime: "09:00",
			defaultEndTime: "17:00",
			defaultHours: 8,
			officeHoursStart: "09:00",
			officeHoursEnd: "14:00",
		},
	},
	use24HourFormat: true,
	showWeekends: false,
};

/**
 * Hook to manage time tracker settings
 */
export function useSettings() {
	const { data: savedDaySettings } = api.time.getDaySettings.useQuery();
	const { data: userSettings } = api.time.getUserSettings.useQuery();
	const { data: currentWeek } = api.time.getCurrentWeek.useQuery();
	const updateDaySettings = api.time.updateDaySettings.useMutation();
	const updateUserSettings = api.time.updateUserSettings.useMutation();

	const [settings, setSettings] = useState<TimeSettings>(defaultTimeSettings);

	// Load saved day settings when component mounts
	useEffect(() => {
		if (savedDaySettings) {
			setSettings((prev) => ({
				...prev,
				defaultDaySettings: {
					...prev.defaultDaySettings,
					...savedDaySettings,
				},
			}));
		}
	}, [savedDaySettings]);

	// Load user settings when component mounts
	useEffect(() => {
		if (userSettings) {
			const updatedSettings: Partial<TimeSettings> = {
				use24HourFormat: userSettings.use24HourFormat,
			};

			// Only set showWeekends if it's defined in the database
			if (userSettings.showWeekends !== undefined) {
				updatedSettings.showWeekends = userSettings.showWeekends;
			}

			setSettings((prev) => ({
				...prev,
				...updatedSettings,
			}));
		}
	}, [userSettings]);

	// Update settings from week data
	useEffect(() => {
		if (currentWeek) {
			setSettings((prev) => ({
				...prev,
				targetHours: currentWeek.targetHours,
				breakDuration: currentWeek.breakDuration,
			}));
		}
	}, [currentWeek]);

	/**
	 * Updates all settings
	 */
	const handleSettingsChange = (newSettings: TimeSettings) => {
		setSettings(newSettings);

		// If the time format or showWeekends has changed, update it in the database
		if (
			userSettings &&
			(newSettings.use24HourFormat !== userSettings.use24HourFormat ||
				newSettings.showWeekends !== userSettings.showWeekends)
		) {
			updateUserSettings.mutate({
				use24HourFormat: newSettings.use24HourFormat,
				showWeekends: newSettings.showWeekends,
			});
		}
	};

	/**
	 * Updates settings for a specific day
	 */
	const handleDaySettingsChange = async (
		day: string,
		daySettings: DaySettings,
	) => {
		// Update local state first for immediate UI feedback
		setSettings((prev) => {
			// Create a new defaultDaySettings object
			const newDaySettings = { ...prev.defaultDaySettings };

			// Ensure the day settings object is fully defined
			newDaySettings[day] = {
				defaultStartTime: daySettings.defaultStartTime || "09:00",
				defaultEndTime: daySettings.defaultEndTime || "17:00",
				defaultHours: daySettings.defaultHours ?? 8,
				officeHoursStart: daySettings.officeHoursStart || "09:00",
				officeHoursEnd: daySettings.officeHoursEnd || "17:00",
			};

			return {
				...prev,
				defaultDaySettings: newDaySettings,
			};
		});

		// Then save to the database
		try {
			await updateDaySettings.mutateAsync({
				dayName: day,
				defaultStartTime: daySettings.defaultStartTime || "09:00",
				defaultEndTime: daySettings.defaultEndTime || "17:00",
				defaultHours: daySettings.defaultHours ?? 8,
				officeHoursStart: daySettings.officeHoursStart || "09:00",
				officeHoursEnd: daySettings.officeHoursEnd || "17:00",
			});
		} catch (error) {
			console.error("Failed to save day settings:", error);
		}
	};

	return {
		settings,
		handleSettingsChange,
		handleDaySettingsChange,
	};
}
