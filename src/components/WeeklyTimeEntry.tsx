"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface TimeEntry {
	hours: number;
}

interface WeeklyTimeEntryProps {
	onTimeEntryChange?: (entries: Record<string, TimeEntry>) => void;
	initialEntries?: Record<string, TimeEntry>;
}

export function WeeklyTimeEntry({
	onTimeEntryChange,
	initialEntries
}: WeeklyTimeEntryProps) {
	const [timeEntries, setTimeEntries] = useState<Record<string, TimeEntry>>(
		initialEntries ?? {
			monday: { hours: 0 },
			tuesday: { hours: 0 },
			wednesday: { hours: 0 },
			thursday: { hours: 0 },
			friday: { hours: 0 },
			saturday: { hours: 0 },
			sunday: { hours: 0 }
		}
	);

	const handleHoursChange = (day: string, value: string) => {
		const hours = Number.parseFloat(value) || 0;
		const newEntries = {
			...timeEntries,
			[day]: { hours }
		};
		setTimeEntries(newEntries);
		onTimeEntryChange?.(newEntries);
	};

	const days = [
		{ key: "monday", label: "Monday" },
		{ key: "tuesday", label: "Tuesday" },
		{ key: "wednesday", label: "Wednesday" },
		{ key: "thursday", label: "Thursday" },
		{ key: "friday", label: "Friday" },
		{ key: "saturday", label: "Saturday" },
		{ key: "sunday", label: "Sunday" }
	];

	return (
		<Card className="p-4">
			<div className="grid grid-cols-7 gap-4">
				{days.map(({ key, label }) => (
					<div key={key} className="flex flex-col items-center space-y-2">
						<Label htmlFor={`${key}-hours`}>{label}</Label>
						<Input
							id={`${key}-hours`}
							type="number"
							min="0"
							max="24"
							step="0.5"
							value={timeEntries[key]?.hours ?? ""}
							onChange={(e) => handleHoursChange(key, e.target.value)}
							className="w-20 text-center"
							placeholder="0"
						/>
					</div>
				))}
			</div>
		</Card>
	);
}
