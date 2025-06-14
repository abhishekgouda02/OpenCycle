/*
  # Create Utility Functions and Views

  1. Functions
    - `get_item_stats` - Get statistics for an item (views, favorites)
    - `get_user_stats` - Get statistics for a user (items posted, etc.)
    - `search_items` - Full-text search for items

  2. Views
    - `items_with_stats` - Items with view and favorite counts
    - `user_dashboard_stats` - User statistics for dashboard

  3. Full-Text Search
    - Add search vectors for items
    - Create search index
*/

-- Create function to get item statistics
CREATE OR REPLACE FUNCTION public.get_item_stats(item_uuid uuid)
RETURNS TABLE (
  view_count bigint,
  favorite_count bigint,
  unique_viewers bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(v.view_count, 0) as view_count,
    COALESCE(f.favorite_count, 0) as favorite_count,
    COALESCE(v.unique_viewers, 0) as unique_viewers
  FROM (
    SELECT 1 -- dummy row to ensure we always return something
  ) dummy
  LEFT JOIN (
    SELECT 
      COUNT(*) as view_count,
      COUNT(DISTINCT COALESCE(user_id, ip_address::text)) as unique_viewers
    FROM public.item_views 
    WHERE item_id = item_uuid
  ) v ON true
  LEFT JOIN (
    SELECT COUNT(*) as favorite_count
    FROM public.favorites 
    WHERE item_id = item_uuid
  ) f ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid uuid)
RETURNS TABLE (
  total_items bigint,
  available_items bigint,
  claimed_items bigint,
  total_views bigint,
  total_favorites bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(i.total_items, 0) as total_items,
    COALESCE(i.available_items, 0) as available_items,
    COALESCE(i.claimed_items, 0) as claimed_items,
    COALESCE(v.total_views, 0) as total_views,
    COALESCE(f.total_favorites, 0) as total_favorites
  FROM (
    SELECT 1 -- dummy row
  ) dummy
  LEFT JOIN (
    SELECT 
      COUNT(*) as total_items,
      COUNT(*) FILTER (WHERE is_available = true) as available_items,
      COUNT(*) FILTER (WHERE is_available = false) as claimed_items
    FROM public.items 
    WHERE user_id = user_uuid
  ) i ON true
  LEFT JOIN (
    SELECT COUNT(*) as total_views
    FROM public.item_views iv
    JOIN public.items i ON iv.item_id = i.id
    WHERE i.user_id = user_uuid
  ) v ON true
  LEFT JOIN (
    SELECT COUNT(*) as total_favorites
    FROM public.favorites f
    JOIN public.items i ON f.item_id = i.id
    WHERE i.user_id = user_uuid
  ) f ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add search vector column to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION public.update_item_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update search vector
CREATE TRIGGER update_items_search_vector
  BEFORE INSERT OR UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_item_search_vector();

-- Update existing items with search vectors
UPDATE public.items SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(location, '')), 'D');

-- Create search index
CREATE INDEX IF NOT EXISTS idx_items_search_vector ON public.items USING gin(search_vector);

-- Create function for full-text search
CREATE OR REPLACE FUNCTION public.search_items(
  search_query text,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  image_url text,
  category text,
  condition item_condition,
  location text,
  is_available boolean,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.description,
    i.image_url,
    i.category,
    i.condition,
    i.location,
    i.is_available,
    i.user_id,
    i.created_at,
    i.updated_at,
    ts_rank(i.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM public.items i
  WHERE i.search_vector @@ plainto_tsquery('english', search_query)
    AND i.is_available = true
  ORDER BY rank DESC, i.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for items with statistics
CREATE OR REPLACE VIEW public.items_with_stats AS
SELECT 
  i.*,
  COALESCE(v.view_count, 0) as view_count,
  COALESCE(f.favorite_count, 0) as favorite_count,
  u.full_name as user_full_name,
  u.avatar_url as user_avatar_url
FROM public.items i
LEFT JOIN public.users u ON i.user_id = u.id
LEFT JOIN (
  SELECT 
    item_id,
    COUNT(*) as view_count
  FROM public.item_views
  GROUP BY item_id
) v ON i.id = v.item_id
LEFT JOIN (
  SELECT 
    item_id,
    COUNT(*) as favorite_count
  FROM public.favorites
  GROUP BY item_id
) f ON i.id = f.item_id;

-- Grant access to the view
GRANT SELECT ON public.items_with_stats TO authenticated, anon;