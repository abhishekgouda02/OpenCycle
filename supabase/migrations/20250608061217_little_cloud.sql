/*
  # Create Reports Table for Content Moderation

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `reporter_id` (uuid, foreign key to users, nullable for anonymous reports)
      - `reported_item_id` (uuid, foreign key to items, nullable)
      - `reported_user_id` (uuid, foreign key to users, nullable)
      - `reason` (text, not null) - enum: inappropriate, spam, fake, other
      - `description` (text, optional additional details)
      - `status` (text) - enum: pending, reviewed, resolved, dismissed
      - `admin_notes` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `reports` table
    - Users can create reports
    - Only admins can view and manage reports (future feature)

  3. Constraints
    - Must report either an item or a user (not both, not neither)

  4. Indexes
    - Index on status for admin filtering
    - Index on created_at for sorting
*/

-- Create custom types
DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM ('inappropriate', 'spam', 'fake', 'scam', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reported_item_id uuid REFERENCES public.items(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  description text,
  status report_status DEFAULT 'pending' NOT NULL,
  admin_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT check_report_target CHECK (
    (reported_item_id IS NOT NULL AND reported_user_id IS NULL) OR
    (reported_item_id IS NULL AND reported_user_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create reports"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Note: Admin policies would be added later when admin roles are implemented

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_item_id ON public.reports(reported_item_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER handle_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();