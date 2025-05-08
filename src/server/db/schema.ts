// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTableCreator,
	text,
	time,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-proj ect schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `timetracker_${name}`);

export const workWeeks = createTable(
	"work_week",
	(t) => ({
		id: t.integer().primaryKey().generatedByDefaultAsIdentity(),
		weekNumber: t.integer().notNull(),
		year: t.integer().notNull(),
		targetHours: t.integer().notNull(), // 40 or 32
		breakDuration: t.integer().notNull(), // in minutes
		createdAt: t
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: t.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [index("week_year_idx").on(t.weekNumber, t.year)],
);

export const workWeeksRelations = relations(workWeeks, ({ many }) => ({
	workDays: many(workDays),
}));

export const workDays = createTable(
	"work_day",
	(t) => ({
		id: t.integer().primaryKey().generatedByDefaultAsIdentity(),
		weekId: t
			.integer()
			.notNull()
			.references(() => workWeeks.id),
		date: t.timestamp({ withTimezone: true }).notNull(),
		startTime: t.time().notNull(),
		endTime: t.time().notNull(),
		totalHours: t.integer().notNull(), // in minutes
		isDayOff: t.boolean().default(false).notNull(), // Day off (like weekend)
		createdAt: t
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: t.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [index("week_day_idx").on(t.weekId, t.date)],
);

export const workDaysRelations = relations(workDays, ({ one }) => ({
	week: one(workWeeks, {
		fields: [workDays.weekId],
		references: [workWeeks.id],
	}),
}));

// Day settings table to store default settings for each day of the week
export const daySettings = createTable(
	"day_settings",
	(t) => ({
		id: t.integer().primaryKey().generatedByDefaultAsIdentity(),
		dayName: t.varchar("dayName", { length: 20 }).notNull(), // monday, tuesday, etc.
		defaultStartTime: t.time().notNull().default(sql`'09:00:00'`),
		defaultEndTime: t.time().notNull().default(sql`'17:00:00'`),
		defaultHours: t.integer().notNull().default(480), // in minutes, default 8 hours (480 min)
		officeHoursStart: t.time().notNull().default(sql`'09:00:00'`), // Office hours start time
		officeHoursEnd: t.time().notNull().default(sql`'17:00:00'`), // Office hours end time
		createdAt: t
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: t.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [index("day_name_idx").on(t.dayName)],
);

// User settings table to store user preferences
export const userSettings = createTable("user_settings", (t) => ({
	id: t.integer().primaryKey().generatedByDefaultAsIdentity(),
	use24HourFormat: t.boolean().default(true).notNull(),
	showWeekends: t.boolean().default(true).notNull(),
	createdAt: t
		.timestamp({ withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: t.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));
