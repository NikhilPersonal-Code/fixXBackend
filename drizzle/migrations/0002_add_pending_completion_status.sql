-- Add pending_completion status to task_status enum
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'pending_completion' AFTER 'in_progress';

-- Add completion tracking fields to tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS completion_requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completion_requested_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS completion_rejection_reason TEXT;

-- Create index on completion_requested_by for better query performance
CREATE INDEX IF NOT EXISTS tasks_completion_requested_by_idx ON tasks(completion_requested_by);

-- Add comment to explain the new status
COMMENT ON COLUMN tasks.status IS 'Task status: draft, posted, assigned, in_progress, pending_completion, completed, cancelled';
COMMENT ON COLUMN tasks.completion_requested_by IS 'User ID of the fixxer who requested task completion';
COMMENT ON COLUMN tasks.completion_requested_at IS 'Timestamp when completion was requested';
COMMENT ON COLUMN tasks.completion_rejection_reason IS 'Reason provided by client when rejecting completion';
