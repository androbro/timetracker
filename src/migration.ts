import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString =
	"postgres://postgres:postgres@localhost:5432/timetracker";

// For migrations
const migrationClient = postgres(connectionString, { max: 1 });

// Run the migration
async function main() {
	try {
		console.log("Adding columns to the database...");

		// Create a simple query to add the missing columns
		const queryResult = await migrationClient`
      ALTER TABLE "timetracker_work_day" 
      ADD COLUMN IF NOT EXISTS "isDayOff" boolean DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS "isHoliday" boolean DEFAULT false NOT NULL;
    `;

		console.log("Migration completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
}

main();
