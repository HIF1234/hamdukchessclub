ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS session_notes text,
  ADD COLUMN IF NOT EXISTS attendance_taken_at timestamptz;