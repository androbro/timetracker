"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface WorkDay {
	id: number;
	date: Date;
	startTime: string;
	endTime: string;
	totalHours: number;
}

interface WorkWeek {
	id: number;
	weekNumber: number;
	year: number;
	targetHours: number;
	breakDuration: number;
	workDays: WorkDay[];
}

interface WeeklyViewProps {
	week: WorkWeek | null;
}

export function WeeklyView({ week }: WeeklyViewProps) {
	if (!week) return null;

	const totalHoursWorked =
		week.workDays.reduce((acc, day) => acc + day.totalHours, 0) / 60; // Convert minutes to hours
	const remainingHours = week.targetHours - totalHoursWorked;

	return (
		<Card className="col-span-2">
			<CardHeader>
				<CardTitle>Week {week.weekNumber} Overview</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="rounded-lg bg-muted p-4">
							<p className="font-medium text-sm">Total Hours Worked</p>
							<p className="font-bold text-2xl">
								{totalHoursWorked.toFixed(2)}h
							</p>
						</div>
						<div className="rounded-lg bg-muted p-4">
							<p className="font-medium text-sm">Remaining Hours</p>
							<p className="font-bold text-2xl">{remainingHours.toFixed(2)}h</p>
						</div>
					</div>

					<div className="space-y-2">
						<h3 className="font-medium">Daily Entries</h3>
						<div className="rounded-md border">
							<table className="w-full">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="p-2 text-left">Date</th>
										<th className="p-2 text-left">Start Time</th>
										<th className="p-2 text-left">End Time</th>
										<th className="p-2 text-left">Hours</th>
									</tr>
								</thead>
								<tbody>
									{week.workDays.map((day) => (
										<tr key={day.id} className="border-b">
											<td className="p-2">
												{format(new Date(day.date), "EEEE, MMM d")}
											</td>
											<td className="p-2">{day.startTime}</td>
											<td className="p-2">{day.endTime}</td>
											<td className="p-2">
												{(day.totalHours / 60).toFixed(2)}h
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
