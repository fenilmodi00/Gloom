# Supabase Dummy Data Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Populate Supabase database with dummy data (1 user, 10 wardrobe items, 5 outfits) using real images from assets/fashion_categorized/

**Architecture:** Hybrid approach using Supabase MCP tools for database operations and Node.js script for image uploads

**Tech Stack:** Supabase MCP, Node.js, Supabase JS client, PostgreSQL

---

### Task 1: Get Supabase Keys & Update .env

**Files:**
- Modify: `backend/.env`

**Step 1: Retrieve Supabase keys via MCP**

Run: `supabase_get_publishable_keys`
Expected: Returns project URL, anon key, service role key

**Step 2: Update .env file**

Update these variables in `backend/.env`:
```
SUPABASE_URL=[from MCP]
SUPABASE_JWT_SECRET=[from MCP - may be same as anon key]
SUPABASE_SERVICE_ROLE_KEY=[from MCP]
```

**Step 3: Verify connection**

Run: `supabase_list_tables`
Expected: Lists existing tables (profiles, wardrobe_items, outfits)

**Step 4: Commit**

```bash
git add backend/.env
git commit -m "feat: add Supabase credentials to .env"
```

### Task 2: Create Storage Bucket via SQL

**Files:**
- Execute SQL via MCP

**Step 1: Create storage bucket**

Run: `supabase_execute_sql` with query:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wardrobe-images', 'wardrobe-images', true)
ON CONFLICT (id) DO NOTHING;
```

Expected: Bucket created or already exists

**Step 2: Verify bucket creation**

Run: `supabase_execute_sql` with query:
```sql
SELECT * FROM storage.buckets WHERE id = 'wardrobe-images';
```

Expected: Returns bucket record with public=true

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: create wardrobe-images storage bucket"
```

### Task 3: Write Image Upload Script

**Files:**
- Create: `scripts/upload-images.js`
- Create: `package.json` (if not exists)

**Step 1: Create upload script**

```javascript
// scripts/upload-images.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImages() {
  const imageDir = './assets/fashion_categorized';
  const categories = ['top', 'bottom', 'shoes', 'accessories'];
  const results = [];
  
  for (const category of categories) {
    const categoryPath = path.join(imageDir, category);
    if (!fs.existsSync(categoryPath)) continue;
    
    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.png'));
    
    for (const file of files.slice(0, 3)) { // Limit to 3 per category for demo
      const filePath = path.join(categoryPath, file);
      const fileBuffer = fs.readFileSync(filePath);
      const storagePath = `${category}/${file}`;
      
      const { data, error } = await supabase.storage
        .from('wardrobe-images')
        .upload(storagePath, fileBuffer, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (error) {
        console.error(`Error uploading ${file}:`, error);
        continue;
      }
      
      const { data: urlData } = supabase.storage
        .from('wardrobe-images')
        .getPublicUrl(storagePath);
      
      results.push({
        category,
        filename: file,
        storagePath,
        publicUrl: urlData.publicUrl
      });
      
      console.log(`Uploaded: ${file} -> ${urlData.publicUrl}`);
    }
  }
  
  // Save results to JSON for SQL generation
  fs.writeFileSync('./uploaded-images.json', JSON.stringify(results, null, 2));
  console.log(`Uploaded ${results.length} images`);
}

uploadImages().catch(console.error);
```

**Step 2: Install dependencies**

Run: `npm install @supabase/supabase-js`
Expected: Package installed

**Step 3: Test script**

Run: `node scripts/upload-images.js`
Expected: Images uploaded, JSON file created

**Step 4: Commit**

```bash
git add scripts/upload-images.js package.json package-lock.json
git commit -m "feat: add image upload script for Supabase Storage"
```

### Task 4: Generate & Execute Dummy Data SQL

**Files:**
- Create: `scripts/generate-sql.js`
- Execute SQL via MCP

**Step 1: Create SQL generation script**

```javascript
// scripts/generate-sql.js
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Load uploaded images
const uploadedImages = JSON.parse(fs.readFileSync('./uploaded-images.json', 'utf8'));

// Generate user ID
const userId = uuidv4();

// Generate profile SQL
const profileSql = `
INSERT INTO profiles (id, name, avatar_url, body_photo_url, skin_tone, style_tags, created_at)
VALUES (
  '${userId}',
  'Demo User',
  'https://via.placeholder.com/150',
  'https://via.placeholder.com/300x400',
  'warm',
  ARRAY['casual', 'minimalist'],
  NOW()
) ON CONFLICT (id) DO NOTHING;
`;

// Generate wardrobe items SQL
const wardrobeItems = uploadedImages.map((img, index) => {
  const categories = {
    'top': 'tops',
    'bottom': 'bottoms', 
    'shoes': 'shoes',
    'accessories': 'accessories'
  };
  
  const colors = [['white', 'black'], ['navy', 'beige'], ['brown', 'cream']][index % 3];
  const styleTags = [['casual', 'minimalist'], ['streetwear', 'classic'], ['old_money', 'bohemian']][index % 3];
  const occasionTags = [['daytime', 'work'], ['weekend', 'casual_friday'], ['night_out', 'date_night']][index % 3];
  
  return `
INSERT INTO wardrobe_items (id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, fabric_guess, created_at)
VALUES (
  '${uuidv4()}',
  '${userId}',
  '${img.publicUrl}',
  NULL,
  '${categories[img.category]}',
  NULL,
  ARRAY['${colors.join("', '")}'],
  ARRAY['${styleTags.join("', '")}'],
  ARRAY['${occasionTags.join("', '")}'],
  NULL,
  NOW() - interval '${index} days'
) ON CONFLICT (id) DO NOTHING;`;
});

// Generate outfits SQL (5 outfits)
const outfitItems = uploadedImages.slice(0, 10); // Use first 10 items
const outfits = [];
for (let i = 0; i < 5; i++) {
  const item1 = outfitItems[i * 2];
  const item2 = outfitItems[i * 2 + 1];
  
  if (!item1 || !item2) continue;
  
  const occasions = ['casual', 'work', 'weekend', 'night_out', 'date_night'];
  const vibes = ['relaxed', 'professional', 'fun', 'elegant', 'romantic'];
  
  outfits.push(`
INSERT INTO outfits (id, user_id, item_ids, occasion, vibe, color_reasoning, ai_score, cover_image_url, created_at)
VALUES (
  '${uuidv4()}',
  '${userId}',
  ARRAY['${item1.storagePath}', '${item2.storagePath}'],
  '${occasions[i]}',
  '${vibes[i]}',
  'Complementary colors with balanced contrast',
  ${0.7 + (i * 0.05)},
  '${item1.publicUrl}',
  NOW() - interval '${i} days'
) ON CONFLICT (id) DO NOTHING;`);
}

// Combine all SQL
const fullSql = [profileSql, ...wardrobeItems, ...outfits].join('\n');

fs.writeFileSync('./dummy-data.sql', fullSql);
console.log(`Generated SQL for 1 profile, ${wardrobeItems.length} wardrobe items, ${outfits.length} outfits`);
```

**Step 2: Install UUID dependency**

Run: `npm install uuid`
Expected: Package installed

**Step 3: Generate SQL**

Run: `node scripts/generate-sql.js`
Expected: SQL file created

**Step 4: Execute SQL via MCP**

Run: `supabase_execute_sql` with contents of `dummy-data.sql`
Expected: All INSERT statements execute successfully

**Step 5: Verify data**

Run: `supabase_execute_sql` with queries:
```sql
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM wardrobe_items;
SELECT COUNT(*) FROM outfits;
```

Expected: Counts match (1, 10, 5)

**Step 6: Commit**

```bash
git add scripts/generate-sql.js dummy-data.sql
git commit -m "feat: generate and execute dummy data SQL"
```

### Task 5: Verify API Endpoints

**Files:**
- Test backend API endpoints

**Step 1: Start backend server**

Run: `cd backend && go run cmd/server/main.go`
Expected: Server starts on port 8080

**Step 2: Test profile endpoint**

Run: `curl -H "Authorization: Bearer [test-jwt]" http://localhost:8080/api/v1/profile`
Expected: Returns demo user profile

**Step 3: Test wardrobe endpoint**

Run: `curl -H "Authorization: Bearer [test-jwt]" http://localhost:8080/api/v1/wardrobe`
Expected: Returns 10 wardrobe items with image URLs

**Step 4: Test outfits endpoint**

Run: `curl -H "Authorization: Bearer [test-jwt]" http://localhost:8080/api/v1/outfits`
Expected: Returns 5 outfits

**Step 5: Commit verification results**

```bash
git add -A
git commit -m "test: verify API endpoints with dummy data"
```

### Task 6: Final Code Review

**Files:**
- All modified files

**Step 1: Dispatch final code reviewer**

Review all changes for:
- Security (no hardcoded secrets)
- Code quality (clean, readable)
- Test coverage (adequate)
- Documentation (comments where needed)

**Step 2: Address any issues**

Fix any issues found by reviewer

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final review and cleanup"
```