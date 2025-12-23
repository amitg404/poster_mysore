const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SOURCE_DIR = path.join('D:', 'Work_Dir', 'Projects', 'poster_mysore', 'pinterest_scraper', 'downloaded_images');
const DEST_DIR = path.join(__dirname, '..', 'uploads');
const SERVER_URL = 'http://localhost:5000/uploads';

async function main() {
  console.log('📦 Starting Asset Import...');

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    return;
  }

  // Ensure destination exists
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  const genres = fs.readdirSync(SOURCE_DIR);
  
  // Mapping for clean category names
  const categoryMap = {
      'anime': 'Anime',
      'abstract': 'Abstract',
      'band': 'Band',
      'cars': 'Cars', // Already Cap but good to be safe
      'gaming': 'Gaming',
      'geometric art': 'Geometric Art',
      'japanese art': 'Japanese Art',
      'minimalist': 'Minimalist',
      'motivational': 'Motivational',
      'movie': 'Movie',
      'music': 'Music',
      'nature': 'Nature',
      'retro': 'Retro',
      'sci-fi': 'Sci-Fi',
      'space': 'Space',
      'sports': 'Sports',
      'superheros': 'Superheros',
      'tv shows': 'TV Shows',
      'vintage': 'Vintage',
      'my_creations': 'My Creations'
  };

  const allowedCategories = [];

  for (const genreRaw of genres) {
    const genreLower = genreRaw.toLowerCase();
    
    // Skip if it looks like a system folder or scraper artifact
    if (genreLower.includes('named_images')) continue;

    const genrePath = path.join(SOURCE_DIR, genreRaw);
    if (!fs.statSync(genrePath).isDirectory()) continue;

    const categoryName = categoryMap[genreLower] || genreRaw.charAt(0).toUpperCase() + genreRaw.slice(1);
    allowedCategories.push(categoryName);

    console.log(`📂 Processing: ${genreRaw} -> ${categoryName}`);
    
    const files = fs.readdirSync(genrePath);
    let count = 0;
    
    for (const file of files) {
        if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

        const srcPath = path.join(genrePath, file);
        
        // Create unique filename to avoid collisions
        const ext = path.extname(file);
        const uniqueName = `${categoryName.replace(/\s+/g, '_')}-${file}`;
        const destPath = path.join(DEST_DIR, uniqueName);

        // Copy File
        if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
        }

        // Add to Database
        let titleRaw = path.basename(file, ext).replace(/[-_]/g, ' ');
        const title = titleRaw.replace(/\b\w/g, l => l.toUpperCase());
        const imageUrl = `${SERVER_URL}/${uniqueName}`;

        const existing = await prisma.product.findFirst({
            where: { 
                title: title,
                category: categoryName
            }
        });

        if (!existing) {
            await prisma.product.create({
                data: {
                    title: title,
                    description: `Classic ${categoryName} poster. High quality print.`,
                    price: 399,
                    images: JSON.stringify([imageUrl]),
                    category: categoryName,
                    tags: JSON.stringify([categoryName.toLowerCase(), "imported"]),
                }
            });
            process.stdout.write('.'); // Dot progress
        } else {
            // Update the image URL if needed or just skip
             process.stdout.write('s'); 
        }
        count++;
    }
    console.log(`\n   Done with ${categoryName}: ${count} images.`);
  }

  // Cleanup: Remove products with categories NOT in our list
  console.log('🧹 Cleaning up old categories...');
  try {
      const deleteResult = await prisma.product.deleteMany({
          where: {
              category: { notIn: allowedCategories }
          }
      });
      console.log(`❌ Deleted ${deleteResult.count} products from obsolete categories.`);
  } catch (error) {
      if (error.code === 'P2003') {
          console.warn('⚠️ Could not delete some old products because they are referenced in Carts or Orders. (Skipping cleanup for these items)');
      } else {
          console.error('❌ Cleanup failed:', error);
      }
  }

  console.log('🎉 Import Complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
