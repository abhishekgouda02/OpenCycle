/*
  # Create Items Table

  1. New Tables
    - `items`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, not null)
      - `image_url` (text, optional)
      - `category` (text, not null)
      - `condition` (text, not null) - enum: new, like-new, good, fair, poor
      - `location` (text, not null)
      - `is_available` (boolean, default true)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `items` table
    - Add policies for public read access to available items
    - Add policies for users to manage their own items
    - Add trigger for automatic updated_at timestamp

  3. Indexes
    - Index on user_id for performance
    - Index on is_available for filtering
    - Index on category for filtering
    - Index on created_at for sorting
*/

-- Create custom type for item condition
DO $$ BEGIN
  CREATE TYPE item_condition AS ENUM ('new', 'like-new', 'good', 'fair', 'poor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create items table
CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  category text NOT NULL,
  condition item_condition NOT NULL DEFAULT 'good',
  location text NOT NULL,
  is_available boolean DEFAULT true NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view available items"
  ON public.items
  FOR SELECT
  USING (is_available = true);

CREATE POLICY "Authenticated users can view all items"
  ON public.items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own items"
  ON public.items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON public.items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON public.items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_is_available ON public.items(is_available);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON public.items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_location ON public.items(location);

-- Create trigger for updated_at
CREATE TRIGGER handle_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();