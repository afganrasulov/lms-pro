-- Migration: Add Course Settings Columns
-- Description: Adds subtitle, level, and category to courses table to support better course metadata management.

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS subtitle text,
ADD COLUMN IF NOT EXISTS level text,
ADD COLUMN IF NOT EXISTS category text;
