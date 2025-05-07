"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

// Custom TimeInput component for better time picking
export interface TimeInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	disabled?: boolean;
	id?: string;
	step?: string;
	required?: boolean;
	className?: string;
	"aria-label"?: string;
	use24HourFormat?: boolean;
}

export const TimeInput = ({
	label,
	value,
	onChange,
	error,
	disabled,
	className,
	use24HourFormat = true,
	...props
}: TimeInputProps) => {
	// Format the time to ensure it's in HH:MM format without seconds
	const formattedValue = value?.split(":").slice(0, 2).join(":") || "";

	// Safely parse hours from formatted value - memoized with useCallback
	const getHours = useCallback((timeStr: string): number => {
		const parts = timeStr.split(":");
		return parts[0] ? Number.parseInt(parts[0], 10) : 0;
	}, []);

	// Safely parse minutes from formatted value
	const getMinutes = useCallback((timeStr: string): number => {
		const parts = timeStr.split(":");
		return parts[1] ? Number.parseInt(parts[1], 10) : 0;
	}, []);

	const [isPM, setIsPM] = useState(() => {
		if (!formattedValue) return false;
		return getHours(formattedValue) >= 12;
	});

	useEffect(() => {
		if (formattedValue) {
			setIsPM(getHours(formattedValue) >= 12);
		}
	}, [formattedValue, getHours]);

	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value);
	};

	const toggleAmPm = () => {
		if (!formattedValue) return;

		let hours = getHours(formattedValue);
		const minutes = getMinutes(formattedValue);

		if (isPM && hours >= 12) {
			// Convert PM to AM
			hours = hours === 12 ? 0 : hours - 12;
		} else if (!isPM && hours < 12) {
			// Convert AM to PM
			hours = hours === 0 ? 12 : hours + 12;
		}

		const newTime = `${hours.toString().padStart(2, "0")}:${minutes
			.toString()
			.padStart(2, "0")}`;
		onChange(newTime);
		setIsPM(!isPM);
	};

	return (
		<div className="space-y-1">
			<Label htmlFor={props.id} className="text-xs">
				{label}
			</Label>
			<div className="relative flex">
				<Input
					type="time"
					value={formattedValue}
					onChange={handleTimeChange}
					className={cn(
						"w-full text-center px-1",
						!use24HourFormat && "rounded-r-none",
						disabled && "bg-gray-200 dark:bg-gray-700 opacity-70",
						error && "border-red-500 focus-visible:ring-red-500",
						className
					)}
					disabled={disabled}
					{...props}
					style={{
						fontSize: "0.95rem",
						width: "100%",
						padding: "0.5rem 0.2rem",
						appearance: "textfield"
					}}
				/>

				{!use24HourFormat && !disabled && (
					<button
						type="button"
						onClick={toggleAmPm}
						className={cn(
							"min-w-[40px] h-9 px-2 text-xs font-medium rounded-md flex items-center justify-center cursor-pointer",
							"border border-input border-l-0 rounded-l-none",
							isPM
								? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
								: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
						)}
					>
						{isPM ? "PM" : "AM"}
					</button>
				)}

				{error && (
					<div className="absolute inset-y-0 right-0 flex items-center pr-2">
						<Tooltip>
							<TooltipTrigger className="h-4 w-4 text-red-500">
								!
							</TooltipTrigger>
							<TooltipContent>
								<p>{error}</p>
							</TooltipContent>
						</Tooltip>
					</div>
				)}
			</div>
		</div>
	);
};
