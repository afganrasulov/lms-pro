-- Add position column to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Backfill positions based on creation date to ensure stable initial order
WITH ranked_courses AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as new_pos
  FROM public.courses
)
UPDATE public.courses
SET position = ranked_courses.new_pos
FROM ranked_courses
WHERE public.courses.id = ranked_courses.id;
