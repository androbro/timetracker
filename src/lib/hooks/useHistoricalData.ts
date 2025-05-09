import { api } from "~/trpc/react";

// Define types for work week data
interface WorkDay {
  id: number;
  weekId: number;
  date: Date;
  startTime: string;
  endTime: string;
  totalHours: number;
  lunchBreakMinutes?: number;
  isDayOff: boolean;
  createdAt: Date;
  updatedAt?: Date | null;
}

interface WorkWeek {
  id: number;
  weekNumber: number;
  year: number;
  targetHours: number;
  breakDuration: number;
  createdAt: Date;
  updatedAt?: Date | null;
  workDays: WorkDay[];
}

/**
 * Hook to fetch all historical work week data
 */
export function useHistoricalData() {
  const { data: allWeeks, isLoading, refetch } = api.time.getAllWorkWeeks.useQuery();

  /**
   * Format work week data for display
   */
  const formatWorkWeek = (week: WorkWeek) => {
    const totalMinutes = week.workDays.reduce((acc: number, day: WorkDay) => acc + (day.isDayOff ? 0 : day.totalHours), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    const formattedTotalTime = `${totalHours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
    
    return {
      ...week,
      formattedDate: `Week ${week.weekNumber}, ${week.year}`,
      totalMinutes,
      formattedTotalTime,
      targetHoursFormatted: `${week.targetHours}h`,
      difference: totalMinutes - (week.targetHours * 60),
      differenceFormatted: formatTimeDifference(totalMinutes - (week.targetHours * 60))
    };
  };

  /**
   * Format time difference for display
   */
  const formatTimeDifference = (differenceInMinutes: number) => {
    const hours = Math.floor(Math.abs(differenceInMinutes) / 60);
    const minutes = Math.abs(differenceInMinutes) % 60;
    const isNegative = differenceInMinutes < 0;
    
    return `${isNegative ? '-' : '+'}${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  };

  const formattedWeeks = allWeeks?.map(formatWorkWeek) || [];

  return {
    historicalData: formattedWeeks,
    isLoading,
    refetch
  };
} 