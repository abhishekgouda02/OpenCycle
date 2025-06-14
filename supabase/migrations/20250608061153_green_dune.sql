/*
  # Create Messages Table for User Communication

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `item_id` (uuid, foreign key to items)
      - `requester_id` (uuid, foreign key to users) - person interested in item
      - `owner_id` (uuid, foreign key to users) - item owner
      - `status` (text) - enum: active, closed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to conversations)
      - `sender_id` (uuid, foreign key to users)
      - `content` (text, not null)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only see conversations they're part of
    - Users can only send messages in their conversations

  3. Indexes
    - Index on conversation participants for performance
    - Index on created_at for sorting messages
*/

-- Create custom type for conversation status
DO $$ BEGIN
  CREATE TYPE conversation_status AS ENUM ('active', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status conversation_status DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(item_id, requester_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversation policies
CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create conversations for items"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Conversation participants can update status"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = owner_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = owner_id);

-- Message policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (requester_id = auth.uid() OR owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (requester_id = auth.uid() OR owner_id = auth.uid())
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_item_id ON public.conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_conversations_requester_id ON public.conversations(requester_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner_id ON public.conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- Create trigger for conversations updated_at
CREATE TRIGGER handle_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to update conversation timestamp when new message is added
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp on new message
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();