const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load Supabase credentials from backend/.env
const envPath = path.resolve(__dirname, 'backend', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const SUPABASE_URL = envContent.match(/SUPABASE_URL=(.*)/)[1];
const SUPABASE_SERVICE_ROLE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

// No check needed for temporary public bucket
// if (!SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_service_role_')) {
//   console.error('Error: SUPABASE_SERVICE_ROLE_KEY appears to be a publishable key...');
//   process.exit(1);
// }

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const bucketName = 'wardrobe-images';
const categories = ['top', 'bottom', 'shoes', 'accessories'];
const baseDir = path.resolve(__dirname, 'assets', 'fashion_categorized');

const results = [];

async function uploadImages() {
  for (const category of categories) {
    const categoryDir = path.join(baseDir, category);
    const files = fs.readdirSync(categoryDir).filter(file => file.endsWith('.png'));

    for (const fileName of files) {
      const filePath = path.join(categoryDir, fileName);
      const storagePath = `${category}/${fileName}`;

      try {
        const fileBuffer = await fs.promises.readFile(filePath);

        const { data, error } = await supabase
          .storage
          .from(bucketName)
          .upload(storagePath, fileBuffer, {
            contentType: 'image/png',
            upsert: false // Do not overwrite if exists
          });

        if (error) {
          // If error is due to duplicate, skip and get existing URL
          if (error.message && error.message.includes('Already exists')) {
            console.log(`Skipping duplicate: ${storagePath}`);
          } else {
            throw error;
          }
        }

        // Get public URL (works for both newly uploaded and existing files)
        const { data: urlData } = supabase
          .storage
          .from(bucketName)
          .getPublicUrl(storagePath);
        const publicUrl = urlData.publicUrl;

        results.push(`${storagePath}: ${publicUrl}`);
        console.log(`Uploaded: ${storagePath} -> ${publicUrl}`);
      } catch (err) {
        console.error(`Error processing ${storagePath}:`, err);
      }
    }
  }

  // Write results to file
  const outputPath = path.resolve(__dirname, 'uploaded-image-urls.txt');
  fs.writeFileSync(outputPath, results.join('\n'), 'utf8');
  console.log(`\nResults written to ${outputPath}`);
}

uploadImages().catch(console.error);