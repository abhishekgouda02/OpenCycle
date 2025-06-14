# OpenCycle - Community Item Sharing Platform

A modern web application for sharing and discovering free items in your community. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### Core Functionality
- **User Authentication**: Secure email/password authentication with Supabase Auth
- **Item Management**: Create, edit, and manage giveaway listings with photo uploads
- **Search & Discovery**: Full-text search with filters by category, condition, and location
- **User Profiles**: Customizable profiles with bio, location, and avatar uploads
- **Dashboard**: Personal dashboard with item statistics and management tools

### Advanced Features
- **Image Upload**: Upload photos for items and profile avatars directly from device
- **Messaging System**: Direct communication between users about items
- **Favorites**: Save items for later viewing
- **Analytics**: View counts and engagement metrics for your items
- **Content Moderation**: Report inappropriate content or users
- **File Storage**: Secure file storage with Supabase Storage
- **Responsive Design**: Mobile-first design that works on all devices

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **Vite** for development and building

### Backend
- **Supabase** for database, authentication, and storage
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates
- **Full-text search** with PostgreSQL

## Database Schema

### Core Tables
- `users` - User profiles and metadata
- `items` - Giveaway item listings
- `conversations` - Message threads between users
- `messages` - Individual messages in conversations
- `favorites` - User's saved items
- `item_views` - Analytics for item views
- `reports` - Content moderation reports

### Key Features
- **Row Level Security (RLS)** on all tables
- **Foreign key constraints** for data integrity
- **Indexes** for optimal query performance
- **Triggers** for automatic timestamp updates
- **Full-text search vectors** for advanced search
- **Storage buckets** for file uploads

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd opencycle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Create a `.env` file based on `.env.example`
   - Run the database migrations in order:
     ```sql
     -- Run each migration file in the supabase/migrations/ directory
     -- in your Supabase SQL editor
     ```

4. **Configure Authentication**
   - In Supabase Dashboard > Authentication > Settings
   - Disable email confirmation for development
   - Configure any additional auth providers if needed

5. **Set up Storage**
   - The storage buckets will be created automatically by the migration
   - Configure any additional storage policies if needed

6. **Start the development server**
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Migrations

The database schema is managed through SQL migration files in the `supabase/migrations/` directory. Run these migrations in your Supabase SQL editor in the following order:

1. `create_users_table.sql` - User profiles and authentication
2. `create_items_table.sql` - Item listings
3. `create_messages_table.sql` - Messaging system
4. `create_favorites_table.sql` - User favorites
5. `create_item_views_table.sql` - Analytics
6. `create_reports_table.sql` - Content moderation
7. `create_storage_buckets.sql` - File storage
8. `create_functions_and_views.sql` - Utility functions and views

## API Reference

### Authentication
- `signUp(email, password, fullName)` - Register new user
- `signIn(email, password)` - Sign in user
- `signOut()` - Sign out current user
- `getCurrentUser()` - Get current user session

### Items
- `supabase.from('items').select()` - Get items
- `supabase.from('items').insert()` - Create item
- `supabase.from('items').update()` - Update item
- `supabase.from('items').delete()` - Delete item
- `searchItems(query, limit, offset)` - Full-text search

### Storage
- `uploadFile(bucket, path, file)` - Upload file
- `getPublicUrl(bucket, path)` - Get public URL
- `deleteFile(bucket, path)` - Delete file

### Analytics
- `recordItemView(itemId, userId)` - Record item view
- `getItemStats(itemId)` - Get item statistics
- `getUserStats(userId)` - Get user statistics

### Favorites
- `toggleFavorite(itemId, userId)` - Add/remove favorite

## Security

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:
- Users can only modify their own data
- Public read access for available items
- Private access for user-specific data (favorites, messages)

### File Storage Security
- Public read access for item images and avatars
- Users can only upload/delete their own files
- File size and type restrictions enforced

### Content Moderation
- Report system for inappropriate content
- Admin tools for content review (future feature)

## Performance Optimizations

### Database
- Indexes on frequently queried columns
- Full-text search with GIN indexes
- Efficient foreign key relationships
- Query optimization with views

### Frontend
- Code splitting with React Router
- Optimized images and assets
- Efficient state management
- Responsive design patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Credits

A project made by **Abhishek** and **Ravi**

## License

This project is licensed under the MIT License.