export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          item_id: string
          requester_id: string
          owner_id: string
          status: 'active' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          requester_id: string
          owner_id: string
          status?: 'active' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          requester_id?: string
          owner_id?: string
          status?: 'active' | 'closed'
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          item_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string | null
          category: string
          condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor'
          location: string
          is_available: boolean
          user_id: string
          created_at: string
          updated_at: string
          search_vector: unknown | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          image_url?: string | null
          category: string
          condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor'
          location: string
          is_available?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
          search_vector?: unknown | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string | null
          category?: string
          condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor'
          location?: string
          is_available?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string
          search_vector?: unknown | null
        }
      }
      item_views: {
        Row: {
          id: string
          item_id: string
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string | null
          reported_item_id: string | null
          reported_user_id: string | null
          reason: 'inappropriate' | 'spam' | 'fake' | 'scam' | 'other'
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id?: string | null
          reported_item_id?: string | null
          reported_user_id?: string | null
          reason: 'inappropriate' | 'spam' | 'fake' | 'scam' | 'other'
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string | null
          reported_item_id?: string | null
          reported_user_id?: string | null
          reason?: 'inappropriate' | 'spam' | 'fake' | 'scam' | 'other'
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          bio: string | null
          location: string | null
          avatar_url: string | null
          phone: string | null
          whatsapp: string | null
          instagram: string | null
          contact_preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          bio?: string | null
          location?: string | null
          avatar_url?: string | null
          phone?: string | null
          whatsapp?: string | null
          instagram?: string | null
          contact_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          bio?: string | null
          location?: string | null
          avatar_url?: string | null
          phone?: string | null
          whatsapp?: string | null
          instagram?: string | null
          contact_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      items_with_stats: {
        Row: {
          id: string | null
          title: string | null
          description: string | null
          image_url: string | null
          category: string | null
          condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor' | null
          location: string | null
          is_available: boolean | null
          user_id: string | null
          created_at: string | null
          updated_at: string | null
          search_vector: unknown | null
          view_count: number | null
          favorite_count: number | null
          user_full_name: string | null
          user_avatar_url: string | null
        }
      }
    }
    Functions: {
      get_item_stats: {
        Args: {
          item_uuid: string
        }
        Returns: {
          view_count: number
          favorite_count: number
          unique_viewers: number
        }[]
      }
      get_user_stats: {
        Args: {
          user_uuid: string
        }
        Returns: {
          total_items: number
          available_items: number
          claimed_items: number
          total_views: number
          total_favorites: number
        }[]
      }
      search_items: {
        Args: {
          search_query: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string
          image_url: string
          category: string
          condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor'
          location: string
          is_available: boolean
          user_id: string
          created_at: string
          updated_at: string
          rank: number
        }[]
      }
    }
    Enums: {
      conversation_status: 'active' | 'closed'
      item_condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor'
      report_reason: 'inappropriate' | 'spam' | 'fake' | 'scam' | 'other'
      report_status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
    }
  }
}