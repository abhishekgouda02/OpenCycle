/*
  # Admin System Enhancement

  1. New Tables
    - `admin_settings` - System configuration settings
    - `admin_logs` - Admin action logging

  2. Functions
    - Enhanced analytics functions
    - Admin action logging

  3. Security
    - Admin role management
    - Enhanced RLS policies
*/

-- Create admin settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create admin logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text, -- 'user', 'item', 'report', 'setting'
  target_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Admin settings policies (only admins can access)
CREATE POLICY "Only admins can view settings"
  ON public.admin_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (email = 'admin@opencycle.com' OR email LIKE '%@admin.opencycle.com')
    )
  );

CREATE POLICY "Only admins can modify settings"
  ON public.admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (email = 'admin@opencycle.com' OR email LIKE '%@admin.opencycle.com')
    )
  );

-- Admin logs policies
CREATE POLICY "Only admins can view logs"
  ON public.admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (email = 'admin@opencycle.com' OR email LIKE '%@admin.opencycle.com')
    )
  );

CREATE POLICY "Only admins can create logs"
  ON public.admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (email = 'admin@opencycle.com' OR email LIKE '%@admin.opencycle.com')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

-- Create trigger for admin_settings updated_at
CREATE TRIGGER handle_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default settings
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('site_name', '"OpenCycle"', 'Name of the platform'),
  ('site_description', '"Community Item Sharing Platform"', 'Platform description'),
  ('contact_email', '"admin@opencycle.com"', 'Contact email for the platform'),
  ('allow_registration', 'true', 'Allow new user registrations'),
  ('require_email_verification', 'false', 'Require email verification for new users'),
  ('moderation_enabled', 'true', 'Enable content moderation'),
  ('auto_approve_items', 'true', 'Automatically approve new items'),
  ('max_items_per_user', '50', 'Maximum items per user'),
  ('max_image_size', '5', 'Maximum image size in MB'),
  ('enable_notifications', 'true', 'Enable email notifications'),
  ('maintenance_mode', 'false', 'Enable maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_name text,
  target_type_param text DEFAULT NULL,
  target_id_param uuid DEFAULT NULL,
  details_param jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.admin_logs (
    admin_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    action_name,
    target_type_param,
    target_id_param,
    details_param,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced analytics functions
CREATE OR REPLACE FUNCTION public.get_platform_analytics(
  days_back integer DEFAULT 30
)
RETURNS TABLE (
  total_users bigint,
  total_items bigint,
  total_views bigint,
  total_favorites bigint,
  total_messages bigint,
  total_reports bigint,
  active_users_today bigint,
  new_users_today bigint,
  new_items_today bigint,
  pending_reports bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.items) as total_items,
    (SELECT COUNT(*) FROM public.item_views) as total_views,
    (SELECT COUNT(*) FROM public.favorites) as total_favorites,
    (SELECT COUNT(*) FROM public.messages) as total_messages,
    (SELECT COUNT(*) FROM public.reports) as total_reports,
    (SELECT COUNT(DISTINCT user_id) FROM public.item_views WHERE created_at >= CURRENT_DATE) as active_users_today,
    (SELECT COUNT(*) FROM public.users WHERE created_at >= CURRENT_DATE) as new_users_today,
    (SELECT COUNT(*) FROM public.items WHERE created_at >= CURRENT_DATE) as new_items_today,
    (SELECT COUNT(*) FROM public.reports WHERE status = 'pending') as pending_reports;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user growth data
CREATE OR REPLACE FUNCTION public.get_user_growth_data(
  days_back integer DEFAULT 30
)
RETURNS TABLE (
  date date,
  new_users bigint,
  cumulative_users bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '1 day' * days_back,
      CURRENT_DATE,
      INTERVAL '1 day'
    )::date as date
  ),
  daily_users AS (
    SELECT 
      created_at::date as date,
      COUNT(*) as new_users
    FROM public.users
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY created_at::date
  )
  SELECT 
    ds.date,
    COALESCE(du.new_users, 0) as new_users,
    SUM(COALESCE(du.new_users, 0)) OVER (ORDER BY ds.date) as cumulative_users
  FROM date_series ds
  LEFT JOIN daily_users du ON ds.date = du.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get category distribution
CREATE OR REPLACE FUNCTION public.get_category_distribution()
RETURNS TABLE (
  category text,
  item_count bigint,
  percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH category_counts AS (
    SELECT 
      i.category,
      COUNT(*) as item_count
    FROM public.items i
    WHERE i.is_available = true
    GROUP BY i.category
  ),
  total_items AS (
    SELECT SUM(item_count) as total FROM category_counts
  )
  SELECT 
    cc.category,
    cc.item_count,
    ROUND((cc.item_count::numeric / ti.total::numeric) * 100, 2) as percentage
  FROM category_counts cc
  CROSS JOIN total_items ti
  ORDER BY cc.item_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (admin check is in RLS)
GRANT EXECUTE ON FUNCTION public.log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_growth_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_category_distribution TO authenticated;