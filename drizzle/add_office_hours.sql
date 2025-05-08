ALTER TABLE "timetracker_day_settings" 
ADD COLUMN "officeHoursStart" time NOT NULL DEFAULT '09:00:00',
ADD COLUMN "officeHoursEnd" time NOT NULL DEFAULT '17:00:00'; 