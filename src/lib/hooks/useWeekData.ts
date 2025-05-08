import { api } from "~/trpc/react";

/**
 * Hook to fetch and manage the current week's data
 */
export function useWeekData() {
	const { data: currentWeek, isLoading } = api.time.getCurrentWeek.useQuery();
	const createWeek = api.time.createWeek.useMutation();
	const updateDay = api.time.updateDay.useMutation();

	/**
	 * Creates a new week with the given parameters
	 */
	const createNewWeek = async (params: {
		weekNumber: number;
		year: number;
		targetHours: number;
		breakDuration: number;
	}) => {
		return await createWeek.mutateAsync(params);
	};

	/**
	 * Updates a day in the current week
	 */
	const updateDayInWeek = async (params: {
		weekId: number;
		date: Date;
		startTime: string;
		endTime: string;
		totalHours: number;
		lunchBreakMinutes: number;
		isDayOff: boolean;
	}) => {
		return await updateDay.mutateAsync(params);
	};

	return {
		currentWeek,
		isLoading,
		createNewWeek,
		updateDayInWeek,
	};
}
