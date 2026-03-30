-- Create background_removal_jobs table for idempotent job tracking
CREATE TABLE background_removal_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wardrobe_item_id UUID REFERENCES wardrobe_items(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint to ensure only one active job per wardrobe item
-- Active means not completed or failed
CREATE UNIQUE INDEX idx_background_removal_jobs_active 
ON background_removal_jobs (wardrobe_item_id) 
WHERE status NOT IN ('completed', 'failed');

-- Enable RLS
ALTER TABLE background_removal_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see jobs for their own wardrobe items
CREATE POLICY "Users own their background removal jobs"
  ON background_removal_jobs FOR ALL USING (
    EXISTS (
      SELECT 1 FROM wardrobe_items 
      WHERE wardrobe_items.id = background_removal_jobs.wardrobe_item_id 
      AND wardrobe_items.user_id = auth.uid()
    )
  );

-- Index for performance
CREATE INDEX idx_background_removal_jobs_status ON background_removal_jobs(status);
CREATE INDEX idx_background_removal_jobs_wardrobe_item_id ON background_removal_jobs(wardrobe_item_id);
