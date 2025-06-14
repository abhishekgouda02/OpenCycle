/*
  # Add Foreign Key Relationship Between Items and Users

  1. Database Changes
    - Add foreign key constraint from items.user_id to users.id
    - This enables Supabase to understand the relationship for queries

  2. Security
    - Ensures referential integrity between items and users
    - Prevents orphaned items without valid users
*/

-- Add foreign key constraint to link items.user_id to users.id
ALTER TABLE public.items 
ADD CONSTRAINT fk_items_user_id 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);