-- Add missing location fields to Project (SQLite)
ALTER TABLE "Project" ADD COLUMN "locationDescription" TEXT;
ALTER TABLE "Project" ADD COLUMN "locationSource" TEXT;
ALTER TABLE "Project" ADD COLUMN "locationConfidence" TEXT;
