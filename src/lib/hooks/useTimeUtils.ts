import { useMemo } from "react";
import {
	calculateHours as calculateHoursUtil,
	convertMinutesToTime as convertMinutesToTimeUtil,
	convertTimeToMinutes as convertTimeToMinutesUtil,
	formatHours as formatHoursUtil,
} from "~/components/utils/timeUtils";

/**
 * Hook with utility functions for time calculations
 */
export function useTimeUtils() {
	return useMemo(() => {
		/**
		 * Calculate hours based on start time, end time, and lunch break
		 */
		const calculateHours = (
			startTime: string,
			endTime: string,
			lunchBreakHours: number,
		): number => {
			return calculateHoursUtil(startTime, endTime, lunchBreakHours);
		};

		/**
		 * Format hours to display in a more readable way (e.g., 7h 30m)
		 */
		const formatHours = (hours: number): string => {
			return formatHoursUtil(hours);
		};

		/**
		 * Convert time string (HH:MM) to minutes
		 */
		const convertTimeToMinutes = (time: string): number => {
			return convertTimeToMinutesUtil(time);
		};

		/**
		 * Convert minutes to time string (HH:MM)
		 */
		const convertMinutesToTime = (totalMinutes: number): string => {
			return convertMinutesToTimeUtil(totalMinutes);
		};

		return {
			calculateHours,
			formatHours,
			convertTimeToMinutes,
			convertMinutesToTime,
		};
	}, []); // Empty dependency array means this will be created once
}
