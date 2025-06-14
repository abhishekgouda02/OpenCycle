/*
  # Create Item Views Table for Analytics

  1. New Tables
    - `item_views`
      - `id` (uuid, primary key)
      - `item_id` (uuid, foreign key to items)
      - `user_id` (uuid, foreign key to users, nullable for anonymous views)
      - `ip_address` (inet, for anonymous tracking)
      - `user_agent` (text, optional)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `item_views` table
    - Item owners can view analytics for their items
    - Users can view their own viewing history

  3. Indexes
    - Index on item_id for analytics queries
    - Index on user_id for user history
    - Index on created_at for time-based analytics
*/

-- Create item_views table
CREATE TABLE IF NOT EXISTS public.item_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.item_views ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Item owners can view their item analytics"
  ON public.item_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE id = item_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own viewing history"
  ON public.item_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can record item views"
  ON public.item_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_item_views_item_id ON public.item_views(item_id);
CREATE INDEX IF NOT EXISTS idx_item_views_user_id ON public.item_views(user_id);
CREATE INDEX IF NOT EXISTS idx_item_views_created_at ON public.item_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_views_ip_address ON public.item_views(ip_address);