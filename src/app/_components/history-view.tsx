"use client";

import { Clock, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { useHistoricalData } from "~/lib/hooks/useHistoricalData";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";

interface HistoryViewProps {
  use24HourFormat: boolean;
}

export function HistoryView({ use24HourFormat }: HistoryViewProps) {
  const { historicalData, isLoading } = useHistoricalData();

  const formatTime = (timeString: string) => {
    const [hoursStr = "0", minutesStr = "0"] = timeString.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (use24HourFormat) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <CalendarDays className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="text-xl font-medium">No time records found</h3>
        <p className="text-sm text-gray-500">
          Start tracking your time to see your history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Time Tracking History</h2>
      
      <Accordion type="single" collapsible className="w-full">
        {historicalData.map((week) => (
          <AccordionItem key={`${week.year}-${week.weekNumber}`} value={`${week.year}-${week.weekNumber}`}>
            <AccordionTrigger className="hover:bg-slate-100 dark:hover:bg-slate-800 px-4 rounded-lg">
              <div className="flex flex-1 justify-between items-center">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-medium">{week.formattedDate}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Target:</span>
                    <span>{week.targetHoursFormatted}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Actual:</span>
                    <span>{week.formattedTotalTime}</span>
                  </div>
                  <Badge variant={week.difference >= 0 ? "success" : "destructive"} className="ml-2">
                    {week.differenceFormatted}
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="grid gap-4 pt-2">
                {week.workDays
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((day) => (
                    <Card key={day.id} className={day.isDayOff ? "opacity-60" : ""}>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-base flex justify-between">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {format(new Date(day.date), "EEEE, MMMM d, yyyy")}
                          </span>
                          {day.isDayOff ? (
                            <Badge variant="outline">Day Off</Badge>
                          ) : (
                            <span className="text-sm font-normal">
                              {Math.floor(day.totalHours / 60)}h {day.totalHours % 60 > 0 ? `${day.totalHours % 60}m` : ''}
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      {!day.isDayOff && (
                        <CardContent className="py-2 px-4">
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Start:</span>{" "}
                              <span className="font-medium">{formatTime(day.startTime)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">End:</span>{" "}
                              <span className="font-medium">{formatTime(day.endTime)}</span>
                            </div>
                            {day.lunchBreakMinutes && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Break:</span>{" "}
                                <span>{Math.floor(day.lunchBreakMinutes / 60)}h {day.lunchBreakMinutes % 60 > 0 ? `${day.lunchBreakMinutes % 60}m` : ''}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
} 