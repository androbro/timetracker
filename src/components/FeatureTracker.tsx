"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "./ui/checkbox";
import { cn } from "~/lib/utils";

interface FeatureItem {
	id: string;
	name: string;
	subFeatures?: string[];
}

const features: FeatureItem[] = [
	{
		id: "core-settings",
		name: "Core Settings",
		subFeatures: [
			"Fixed weekly hours target (40/32 hours)",
			"Configurable work days per week (5/4 days)",
			"Configurable break duration"
		]
	},
	{
		id: "daily-time",
		name: "Daily Time Management",
		subFeatures: [
			"Start time input",
			"End time input",
			"Break time inclusion",
			"Daily hours calculation",
			"Special handling for non-standard workdays"
		]
	},
	{
		id: "time-calculator",
		name: "Time Calculator",
		subFeatures: [
			"Two-way time calculation",
			"Early leave planning",
			"Remaining hours display"
		]
	},
	{
		id: "weekly-overview",
		name: "Weekly Overview",
		subFeatures: [
			"Running total of hours worked",
			"Remaining hours for the week",
			"Daily entries list",
			"Weekly summary"
		]
	},
	{
		id: "data-management",
		name: "Data Management",
		subFeatures: [
			"NeonDB integration",
			"Save daily time entries",
			"View historical entries",
			"Export functionality"
		]
	},
	{
		id: "ui-ux",
		name: "UI/UX",
		subFeatures: [
			"Clean, modern interface using shadcn/ui",
			"Daily and weekly views",
			"Easy time input",
			"Responsive design",
			"Simple navigation between views"
		]
	}
];

// Generate unique IDs for each subfeature
const allFeatures = features.flatMap((feature) => {
	// Main feature
	const mainFeature = { id: feature.id, name: feature.name };

	// Subfeatures with IDs
	const subFeatures =
		feature.subFeatures?.map((subFeature) => ({
			id: `${feature.id}-${subFeature.toLowerCase().replace(/\s/g, "-")}`,
			name: subFeature,
			parentId: feature.id
		})) || [];

	return [mainFeature, ...subFeatures];
});

interface FeatureTrackerProps {
	className?: string;
}

export function FeatureTracker({ className }: FeatureTrackerProps) {
	const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

	// Load saved state from localStorage on component mount
	useEffect(() => {
		const savedState = localStorage.getItem("featureTracker");
		if (savedState) {
			try {
				setCheckedItems(JSON.parse(savedState));
			} catch (e) {
				console.error("Error loading feature tracker state", e);
			}
		}
	}, []);

	// Save state to localStorage whenever it changes
	useEffect(() => {
		if (Object.keys(checkedItems).length > 0) {
			localStorage.setItem("featureTracker", JSON.stringify(checkedItems));
		}
	}, [checkedItems]);

	const handleItemCheck = (id: string, checked: boolean) => {
		setCheckedItems((prev) => ({
			...prev,
			[id]: checked
		}));
	};

	return (
		<div
			className={cn(
				"p-4 bg-white rounded-md h-full overflow-auto text-black",
				className
			)}
		>
			<h2 className="text-xl font-bold mb-4">Time Tracker Features</h2>
			<div className="space-y-4">
				{features.map((feature) => (
					<div key={feature.id} className="space-y-2">
						<div className="flex items-center gap-2">
							<Checkbox
								id={feature.id}
								checked={checkedItems[feature.id] || false}
								onCheckedChange={(checked) =>
									handleItemCheck(feature.id, checked === true)
								}
							/>
							<label
								htmlFor={feature.id}
								className="text-sm font-medium cursor-pointer"
							>
								{feature.name}
							</label>
						</div>

						{feature.subFeatures && (
							<div className="ml-6 space-y-2">
								{feature.subFeatures.map((subFeature) => {
									const subId = `${feature.id}-${subFeature
										.toLowerCase()
										.replace(/\s/g, "-")}`;
									return (
										<div key={subId} className="flex items-center gap-2">
											<Checkbox
												id={subId}
												checked={checkedItems[subId] || false}
												onCheckedChange={(checked) =>
													handleItemCheck(subId, checked === true)
												}
											/>
											<label htmlFor={subId} className="text-sm cursor-pointer">
												{subFeature}
											</label>
										</div>
									);
								})}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
