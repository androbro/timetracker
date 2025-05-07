// Simple migration script to add missing columns
const { Client } = require('pg');

const client = new Client({
	connectionString: 'postgres://postgres:postgres@localhost:5432/timetracker'
});

async function addColumns() {
	try {
		await client.connect();
		console.log('Connected to database');

		// Add columns if they don't exist
		await client.query(`
      ALTER TABLE "timetracker_work_day" 
      ADD COLUMN IF NOT EXISTS "isDayOff" boolean DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS "isHoliday" boolean DEFAULT false NOT NULL;
    `);

		console.log('Migration completed successfully');
	} catch (error) {
		console.error('Migration failed:', error);
	} finally {
		await client.end();
		console.log('Database connection closed');
	}
}

addColumns(); 