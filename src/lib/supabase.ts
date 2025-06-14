import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Storage helpers
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  return { data, error };
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return data.publicUrl;
};

export const deleteFile = async (bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  return { data, error };
};

// Database helpers
export const recordItemView = async (itemId: string, userId?: string) => {
  const { error } = await supabase
    .from('item_views')
    .insert({
      item_id: itemId,
      user_id: userId || null,
      user_agent: navigator.userAgent,
    });
  return { error };
};

export const toggleFavorite = async (itemId: string, userId: string) => {
  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('item_id', itemId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('item_id', itemId)
      .eq('user_id', userId);
    return { error, favorited: false };
  } else {
    // Add favorite
    const { error } = await supabase
      .from('favorites')
      .insert({
        item_id: itemId,
        user_id: userId,
      });
    return { error, favorited: true };
  }
};

export const searchItems = async (
  query: string,
  limit: number = 20,
  offset: number = 0
) => {
  const { data, error } = await supabase
    .rpc('search_items', {
      search_query: query,
      limit_count: limit,
      offset_count: offset,
    });
  return { data, error };
};

export const getItemStats = async (itemId: string) => {
  const { data, error } = await supabase
    .rpc('get_item_stats', {
      item_uuid: itemId,
    });
  return { data: data?.[0], error };
};

export const getUserStats = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('get_user_stats', {
      user_uuid: userId,
    });
  return { data: data?.[0], error };
};