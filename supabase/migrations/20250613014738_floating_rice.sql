/*
  # Add Contact Information Fields to Users Table

  1. Database Changes
    - Add phone number field for SMS/calls
    - Add WhatsApp number field
    - Add Instagram handle field
    - Add contact preferences field

  2. Security
    - Users control visibility of their contact information
    - Contact info only shown to authenticated users viewing items
*/

-- Add contact information fields to users table
DO $$
BEGIN
  -- Add phone field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone text;
  END IF;

  -- Add whatsapp field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE public.users ADD COLUMN whatsapp text;
  END IF;

  -- Add instagram field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE public.users ADD COLUMN instagram text;
  END IF;

  -- Add contact preferences field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'contact_preferences'
  ) THEN
    ALTER TABLE public.users ADD COLUMN contact_preferences jsonb DEFAULT '{"show_phone": true, "show_whatsapp": true, "show_instagram": true}'::jsonb;
  END IF;
END $$;

-- Create index for contact preferences
CREATE INDEX IF NOT EXISTS idx_users_contact_preferences ON public.users USING gin(contact_preferences);