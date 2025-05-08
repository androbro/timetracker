import type { DaySettings } from "../Settings";

// Define day keys type for better type safety
export type DayKey =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday";

export interface TimeEntry {
	hours: number;
	isDayOff: boolean;
	startTime: string;
	endTime: string;
	lunchBreakHours: number;
	verified?: boolean; // Indicates if this day has been verified/completed
}

export interface WeeklyTimeEntryProps {
	onTimeEntryChange?: (
		entries: Record<string, TimeEntry>,
		changedDay?: string,
	) => void;
	initialEntries?: Partial<Record<string, Partial<TimeEntry>>>;
	targetHours: number;
	defaultDaySettings: Record<string, DaySettings>;
	onDaySettingsChange?: (day: string, settings: DaySettings) => void;
	use24HourFormat?: boolean;
	showWeekends?: boolean;
	onOpenSettings?: () => void;
}

export const DAYS = [
	{ key: "monday", label: "Monday" },
	{ key: "tuesday", label: "Tuesday" },
	{ key: "wednesday", label: "Wednesday" },
	{ key: "thursday", label: "Thursday" },
	{ key: "friday", label: "Friday" },
	{ key: "saturday", label: "Saturday" },
	{ key: "sunday", label: "Sunday" },
] as const;
