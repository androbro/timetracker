import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
	daySettings,
	userSettings,
	workDays,
	workWeeks,
} from "~/server/db/schema";

export const timeRouter = createTRPCRouter({
	getCurrentWeek: publicProcedure.query(async ({ ctx }) => {
		const now = new Date();
		const weekNumber = getWeekNumber(now);
		const year = now.getFullYear();

		const week = await ctx.db.query.workWeeks.findFirst({
			where: and(
				eq(workWeeks.weekNumber, weekNumber),
				eq(workWeeks.year, year),
			),
			with: {
				workDays: true,
			},
		});

		return week || null;
	}),

	createWeek: publicProcedure
		.input(
			z.object({
				weekNumber: z.number(),
				year: z.number(),
				targetHours: z.number(),
				breakDuration: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.insert(workWeeks).values(input).returning();
		}),

	updateDay: publicProcedure
		.input(
			z.object({
				weekId: z.number(),
				date: z.date(),
				startTime: z.string(),
				endTime: z.string(),
				totalHours: z.number(),
				isDayOff: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existingDay = await ctx.db.query.workDays.findFirst({
				where: and(
					eq(workDays.weekId, input.weekId),
					eq(workDays.date, input.date),
				),
			});

			if (existingDay) {
				return ctx.db
					.update(workDays)
					.set(input)
					.where(eq(workDays.id, existingDay.id))
					.returning();
			}

			return ctx.db.insert(workDays).values(input).returning();
		}),

	getDaySettings: publicProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db.query.daySettings.findMany();

		// Define a proper type for the day settings
		interface DaySettingsOutput {
			defaultStartTime: string;
			defaultEndTime: string;
			defaultHours: number;
			officeHoursStart: string;
			officeHoursEnd: string;
		}

		// Convert to an object with day names as keys
		const settingsMap: Record<string, DaySettingsOutput> = {};
		for (const setting of settings) {
			settingsMap[setting.dayName] = {
				defaultStartTime: setting.defaultStartTime,
				defaultEndTime: setting.defaultEndTime,
				defaultHours: setting.defaultHours / 60, // Convert minutes to hours for frontend
				officeHoursStart: setting.officeHoursStart,
				officeHoursEnd: setting.officeHoursEnd,
			};
		}

		return settingsMap;
	}),

	updateDaySettings: publicProcedure
		.input(
			z.object({
				dayName: z.string(),
				defaultStartTime: z.string(),
				defaultEndTime: z.string(),
				defaultHours: z.number(),
				officeHoursStart: z.string(),
				officeHoursEnd: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const {
				dayName,
				defaultStartTime,
				defaultEndTime,
				defaultHours,
				officeHoursStart,
				officeHoursEnd,
			} = input;

			// Convert hours to minutes for storage
			const defaultHoursMinutes = Math.round(defaultHours * 60);

			const existingSettings = await ctx.db.query.daySettings.findFirst({
				where: eq(daySettings.dayName, dayName),
			});

			if (existingSettings) {
				return ctx.db
					.update(daySettings)
					.set({
						defaultStartTime,
						defaultEndTime,
						defaultHours: defaultHoursMinutes,
						officeHoursStart,
						officeHoursEnd,
					})
					.where(eq(daySettings.dayName, dayName))
					.returning();
			}

			return ctx.db
				.insert(daySettings)
				.values({
					dayName,
					defaultStartTime,
					defaultEndTime,
					defaultHours: defaultHoursMinutes,
					officeHoursStart,
					officeHoursEnd,
				})
				.returning();
		}),

	getUserSettings: publicProcedure.query(async ({ ctx }) => {
		// Get the first user settings record or create a default one if none exists
		const settings = await ctx.db.query.userSettings.findFirst();

		if (settings) {
			return settings;
		}

		// Create default settings if none exist
		const [defaultSettings] = await ctx.db
			.insert(userSettings)
			.values({
				use24HourFormat: true,
				showWeekends: false,
			})
			.returning();

		return defaultSettings;
	}),

	updateUserSettings: publicProcedure
		.input(
			z.object({
				use24HourFormat: z.boolean(),
				showWeekends: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existingSettings = await ctx.db.query.userSettings.findFirst();

			if (existingSettings) {
				return ctx.db
					.update(userSettings)
					.set(input)
					.where(eq(userSettings.id, existingSettings.id))
					.returning();
			}

			return ctx.db.insert(userSettings).values(input).returning();
		}),

	deleteAllUserData: publicProcedure.mutation(async ({ ctx }) => {
		// Delete all work days
		await ctx.db.delete(workDays);

		// Delete all work weeks
		await ctx.db.delete(workWeeks);

		// Reset day settings to defaults
		await ctx.db.delete(daySettings);

		// Reset user settings to defaults (we don't delete completely to avoid having to recreate them)
		const existingSettings = await ctx.db.query.userSettings.findFirst();
		if (existingSettings) {
			await ctx.db
				.update(userSettings)
				.set({
					use24HourFormat: true,
					showWeekends: false,
				})
				.where(eq(userSettings.id, existingSettings.id));
		}

		return { success: true };
	}),
});

function getWeekNumber(date: Date): number {
	const d = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
	);
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
