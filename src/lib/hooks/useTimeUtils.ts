import { useMemo } from "react";

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
			if (!startTime || !endTime) return 0;

			const startParts = startTime.split(":").map(Number);
			const endParts = endTime.split(":").map(Number);

			if (startParts.length < 2 || endParts.length < 2) return 0;

			const startHour = startParts[0] || 0;
			const startMinute = startParts[1] || 0;
			const endHour = endParts[0] || 0;
			const endMinute = endParts[1] || 0;

			const startMinutes = startHour * 60 + startMinute;
			const endMinutes = endHour * 60 + endMinute;

			// Calculate total work minutes and subtract lunch break
			const workMinutes = endMinutes - startMinutes - lunchBreakHours * 60;

			// Convert back to hours with decimal
			return Math.max(0, workMinutes / 60);
		};

		/**
		 * Format hours to display in a more readable way (e.g., 7h 30m)
		 */
		const formatHours = (hours: number): string => {
			const wholeHours = Math.floor(hours);
			const minutes = Math.round((hours - wholeHours) * 60);

			if (minutes === 0) {
				return `${wholeHours}h`;
			}
			return `${wholeHours}h ${minutes}m`;
		};

		/**
		 * Convert time string (HH:MM) to minutes
		 */
		const convertTimeToMinutes = (time: string): number => {
			const [hours = 0, minutes = 0] = time.split(":").map(Number);
			return hours * 60 + minutes;
		};

		/**
		 * Convert minutes to time string (HH:MM)
		 */
		const convertMinutesToTime = (totalMinutes: number): string => {
			const hours = Math.floor(totalMinutes / 60);
			const minutes = Math.floor(totalMinutes % 60);
			return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
		};

		return {
			calculateHours,
			formatHours,
			convertTimeToMinutes,
			convertMinutesToTime,
		};
	}, []); // Empty dependency array means this will be created once
}
