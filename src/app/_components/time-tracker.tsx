"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "~/components/ui/select";
import { api } from "~/trpc/react";

interface TimeSettings {
	targetHours: number;
	breakDuration: number;
}

export function TimeTracker() {
	const { data: currentWeek, isLoading } = api.time.getCurrentWeek.useQuery();
	const createWeek = api.time.createWeek.useMutation();
	const updateDay = api.time.updateDay.useMutation();

	const [settings, setSettings] = useState<TimeSettings>({
		targetHours: 40,
		breakDuration: 30
	});

	const [startTime, setStartTime] = useState<string>("09:00");
	const [endTime, setEndTime] = useState<string>("17:00");

	useEffect(() => {
		if (currentWeek) {
			setSettings({
				targetHours: currentWeek.targetHours,
				breakDuration: currentWeek.breakDuration
			});
		}
	}, [currentWeek]);

	const calculateHours = (start: string, end: string) => {
		const [startHours, startMinutes] = start.split(":").map(Number);
		const [endHours, endMinutes] = end.split(":").map(Number);

		let totalMinutes =
			endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
		totalMinutes -= settings.breakDuration;

		return totalMinutes / 60;
	};

	const handleSave = async () => {
		if (!currentWeek) {
			const now = new Date();
			const weekNumber = getWeekNumber(now);
			const year = now.getFullYear();

			const week = await createWeek.mutateAsync({
				weekNumber,
				year,
				targetHours: settings.targetHours,
				breakDuration: settings.breakDuration
			});

			if (week[0]) {
				await updateDay.mutateAsync({
					weekId: week[0].id,
					date: new Date(),
					startTime,
					endTime,
					totalHours: calculateHours(startTime, endTime) * 60 // Convert to minutes
				});
			}
		} else {
			await updateDay.mutateAsync({
				weekId: currentWeek.id,
				date: new Date(),
				startTime,
				endTime,
				totalHours: calculateHours(startTime, endTime) * 60 // Convert to minutes
			});
		}
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Settings</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="weekly-hours" className="text-sm font-medium">
							Weekly Hours
						</label>
						<Select
							value={settings.targetHours.toString()}
							onValueChange={(value) =>
								setSettings((prev) => ({ ...prev, targetHours: Number(value) }))
							}
						>
							<SelectTrigger id="weekly-hours">
								<SelectValue placeholder="Select weekly hours" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="40">40 hours (5 days)</SelectItem>
								<SelectItem value="32">32 hours (4 days)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label htmlFor="break-duration" className="text-sm font-medium">
							Break Duration (minutes)
						</label>
						<Input
							id="break-duration"
							type="number"
							value={settings.breakDuration}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									breakDuration: Number(e.target.value)
								}))
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Time Calculator</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="start-time" className="text-sm font-medium">
							Start Time
						</label>
						<Input
							id="start-time"
							type="time"
							value={startTime}
							onChange={(e) => setStartTime(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="end-time" className="text-sm font-medium">
							End Time
						</label>
						<Input
							id="end-time"
							type="time"
							value={endTime}
							onChange={(e) => setEndTime(e.target.value)}
						/>
					</div>

					<div className="pt-4">
						<p className="text-lg">
							Hours worked: {calculateHours(startTime, endTime).toFixed(2)}
						</p>
					</div>

					<Button onClick={handleSave} className="w-full">
						Save
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

function getWeekNumber(date: Date): number {
	const d = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
	);
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
