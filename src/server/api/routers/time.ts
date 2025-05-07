import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { workWeeks, workDays } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

export const timeRouter = createTRPCRouter({
	getCurrentWeek: publicProcedure.query(async ({ ctx }) => {
		const now = new Date();
		const weekNumber = getWeekNumber(now);
		const year = now.getFullYear();

		const week = await ctx.db.query.workWeeks.findFirst({
			where: and(
				eq(workWeeks.weekNumber, weekNumber),
				eq(workWeeks.year, year)
			),
			with: {
				workDays: true,
			},
		});

		return week;
	}),

	createWeek: publicProcedure
		.input(z.object({
			weekNumber: z.number(),
			year: z.number(),
			targetHours: z.number(),
			breakDuration: z.number(),
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.insert(workWeeks).values(input).returning();
		}),

	updateDay: publicProcedure
		.input(z.object({
			weekId: z.number(),
			date: z.date(),
			startTime: z.string(),
			endTime: z.string(),
			totalHours: z.number(),
			isDayOff: z.boolean().default(false),
			isHoliday: z.boolean().default(false),
		}))
		.mutation(async ({ ctx, input }) => {
			const existingDay = await ctx.db.query.workDays.findFirst({
				where: and(
					eq(workDays.weekId, input.weekId),
					eq(workDays.date, input.date)
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
});

function getWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
} 