"use client";

import { Clock, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { EarlyDepartureScheduler } from "~/components/EarlyDepartureScheduler";
import { Settings } from "~/components/Settings";
import { WeeklyTimeEntry } from "~/components/WeeklyTimeEntry";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useSettings } from "~/lib/hooks/useSettings";
import { useTimeEntries } from "~/lib/hooks/useTimeEntries";
import { useTimeEntryMapper } from "~/lib/hooks/useTimeEntryMapper";

export function TimeTracker() {
	const { settings, handleSettingsChange, handleDaySettingsChange } =
		useSettings();
	const { timeEntries, handleTimeEntryChange } = useTimeEntries(settings);
	const { enhanceTimeEntries, simplifyTimeEntries } = useTimeEntryMapper();

	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<string>("weekly-hours");

	return (
		<div className="w-full max-w-5xl">
			<Tabs
				defaultValue="weekly-hours"
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<div className="mb-6 flex items-center justify-between">
					<TabsList>
						<TabsTrigger value="weekly-hours" className="gap-2">
							<Clock className="h-4 w-4" />
							Weekly Hours
						</TabsTrigger>
						<TabsTrigger value="early-departure" className="gap-2">
							<Clock className="h-4 w-4" />
							Early Departure
						</TabsTrigger>
					</TabsList>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsSettingsOpen(true)}
						className="flex h-8 items-center gap-1 text-xs"
					>
						<SettingsIcon className="h-3 w-3" />
						Settings
					</Button>
				</div>

				<TabsContent value="weekly-hours">
					<WeeklyTimeEntry
						onTimeEntryChange={handleTimeEntryChange}
						initialEntries={timeEntries}
						targetHours={settings.targetHours}
						defaultDaySettings={settings.defaultDaySettings}
						onDaySettingsChange={handleDaySettingsChange}
						use24HourFormat={settings.use24HourFormat}
						showWeekends={settings.showWeekends}
						onOpenSettings={() => setIsSettingsOpen(true)}
					/>
				</TabsContent>

				<TabsContent value="early-departure">
					<EarlyDepartureScheduler
						timeEntries={enhanceTimeEntries(timeEntries, settings)}
						targetHours={settings.targetHours}
						daySettings={settings.defaultDaySettings}
						onTimeEntriesChange={(entries) => {
							handleTimeEntryChange(simplifyTimeEntries(entries));
						}}
						use24HourFormat={settings.use24HourFormat}
						showWeekends={settings.showWeekends}
					/>
				</TabsContent>
			</Tabs>

			<Settings
				initialSettings={settings}
				onSettingsChange={handleSettingsChange}
				open={isSettingsOpen}
				onOpenChange={setIsSettingsOpen}
			/>
		</div>
	);
}
