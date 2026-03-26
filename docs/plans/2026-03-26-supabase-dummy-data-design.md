# Supabase Dummy Data Strategy Design

**Date:** 2026-03-26
**Topic:** Push dummy data to Supabase with real images

## Overview
Create a strategy to populate Supabase database with dummy data for testing, demo, and performance evaluation. Use existing mock wardrobe data and fashion images.

## Requirements
- 1 user profile
- 10 wardrobe items per user (with real images)
- 5 outfits per user
- Use existing fashion images from `assets/fashion_categorized/`
- Upload images to Supabase Storage and use public URLs
- Use Supabase MCP tools for database operations

## Design

### 1. Get Supabase Keys via MCP
- Use `supabase_get_publishable_keys` to retrieve API keys
- Update `.env` with actual `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`
- Verify connection with `supabase_list_tables`

### 2. Create Storage Bucket & Upload Images
**Storage Setup:**
- Use `supabase_execute_sql` to create public bucket:
  ```sql
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('wardrobe-images', 'wardrobe-images', true)
  ON CONFLICT (id) DO NOTHING;
  ```

**Image Upload Strategy:**
Hybrid approach:
1. **MCP for database operations** (SQL, migrations, keys)
2. **Small Node.js script** for image uploads using Supabase JS client
3. **MCP to execute final SQL** with public URLs

**Upload Script Features:**
- Reads images from `assets/fashion_categorized/`
- Uploads to `wardrobe-images` bucket
- Returns public URLs for SQL insertion

### 3. Generate Dummy Data SQL
Create SQL INSERT statements for:
- `profiles` table (1 user)
- `wardrobe_items` table (10 items with categories, colors, tags)
- `outfits` table (5 outfits referencing wardrobe items)

Use data from `lib/mock-wardrobe.ts` for realistic tags and categories.

### 4. Execute SQL via MCP
- Use `supabase_execute_sql` to run INSERT statements
- Verify data with SELECT queries
- Test API endpoints with populated data

## Implementation Steps
1. Retrieve Supabase keys via MCP
2. Create storage bucket via SQL
3. Write and run image upload script
4. Generate SQL with public URLs
5. Execute SQL via MCP
6. Verify data and test endpoints

## Success Criteria
- All dummy data inserted into Supabase
- Images accessible via public URLs
- Backend API can fetch and return data
- No errors in Supabase logs

## Risks & Mitigations
- **Risk:** Image upload script may fail
  - **Mitigation:** Use placeholder URLs as fallback
- **Risk:** SQL constraints may prevent insertion
  - **Mitigation:** Use proper UUIDs and foreign keys
- **Risk:** Storage bucket permissions
  - **Mitigation:** Make bucket public for dummy data

## Next Steps
1. Invoke `writing-plans` skill to create detailed implementation plan
2. Execute plan step-by-step
3. Verify all data is accessible via API