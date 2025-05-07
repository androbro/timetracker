-- Add isDayOff and isHoliday columns to the work_day table
ALTER TABLE "timetracker_work_day" 
ADD COLUMN IF NOT EXISTS "isDayOff" boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "isHoliday" boolean DEFAULT false NOT NULL; 