export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  contact_preferences?: {
    show_phone?: boolean;
    show_whatsapp?: boolean;
    show_instagram?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  location: string;
  is_available: boolean;
  user_id: string;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface ItemFormData {
  title: string;
  description: string;
  category: string;
  condition: Item['condition'];
  location: string;
  image_url?: string;
}

export type AuthMode = 'login' | 'register';