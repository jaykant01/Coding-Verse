# Coding Platform Setup Guide

## Resolving the "No authenticated session" and Connection Errors

### Issue 1: "No authenticated session, skipping Supabase save"
This is **NOT an error** - it's expected behavior when users aren't logged in. The app works offline and only syncs to Supabase when authenticated.

### Issue 2: "Could not establish connection. Receiving end does not exist."
This error comes from a browser extension (`content-all.js`) and is unrelated to your app.

## Step-by-Step Setup

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be ready (this may take a few minutes)

### 2. Get Your Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
3. Copy the **anon public** key (starts with `eyJ...`)

### 3. Create Environment File
Create a `.env` file in your project root (same level as `package.json`) with:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Replace the placeholder values with your actual credentials from step 2.**

### 4. Set Up Database
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `database_setup.sql` from this project
3. Paste and run the SQL commands
4. This will create the required tables and security policies

### 5. Configure Authentication
1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:5173` (for development)
3. Under **Redirect URLs**, add: `http://localhost:5173`
4. Save changes

### 6. Test Your Setup
1. Restart your development server: `npm run dev`
2. Open the app in your browser
3. Try to sign up with a new account
4. The app should now work with both local storage and Supabase sync

## How It Works

- **Offline Mode**: App works without authentication using local storage
- **Online Mode**: When authenticated, data syncs to Supabase for cross-device access
- **Fallback**: If Supabase is unavailable, app falls back to local storage
- **Security**: Row Level Security ensures users only see their own data

## Troubleshooting

### Still seeing "No authenticated session"?
- This is normal for unauthenticated users
- Sign up or sign in to enable cloud sync

### Database connection errors?
- Check your `.env` file has correct credentials
- Ensure your Supabase project is active
- Verify the database tables were created successfully

### Authentication not working?
- Check the Site URL and Redirect URLs in Supabase settings
- Ensure you're using `http://localhost:5173` for development
- Clear browser cache and try again

## File Structure
```
Coding-Platform/
├── .env                    ← Create this file with your Supabase credentials
├── database_setup.sql     ← Updated with complete schema
├── src/
│   ├── storage.ts         ← Updated to include user_id in database operations
│   └── App.tsx           ← Main application component
└── package.json           ← Dependencies including @supabase/supabase-js
```

## Next Steps
After setup, users can:
1. Create accounts and sign in
2. Organize coding problems into categories
3. Track progress across devices
4. Work offline with local storage backup
5. Sync data when online and authenticated
