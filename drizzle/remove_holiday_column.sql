-- Remove isHoliday column from the work_day table
ALTER TABLE "timetracker_work_day" 
DROP COLUMN IF EXISTS "isHoliday"; 