-- Migration: Add status field to monthly_payrolls collection
-- This field is required for payroll workflow (draft -> pending_approval -> approved -> paid)

-- Add status field with default value 'draft'
ALTER TABLE monthly_payrolls 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft' NOT NULL;

-- Add comment for the field
COMMENT ON COLUMN monthly_payrolls.status IS 'Payroll status: draft, pending_approval, approved, paid';

-- Update existing records to have draft status
UPDATE monthly_payrolls SET status = 'draft' WHERE status IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_payrolls_status ON monthly_payrolls(status);
