const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SOURCE_DIR = path.join('D:', 'Work_Dir', 'Projects', 'poster_mysore', 'pinterest_scraper', 'downloaded_images');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const SERVER_URL = 'http://localhost:5000/uploads';

// Mapping for clean category names
const categoryMap = {
    'anime': 'Anime',
    'abstract': 'Abstract',
    'band': 'Band',
    'cars': 'Cars',
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
const allowedCategories = Object.values(categoryMap);

async function main() {
    console.log('🔄 Starting Full Catalog Sync...');

    // 1. PRUNE: Remove products from DB if file is missing in UPLOADS
    console.log('\n🧹 Step 1: Pruning Dead Products (DB vs Disk)...');
    const allProducts = await prisma.product.findMany();
    let prunedCount = 0;

    for (const p of allProducts) {
        try {
            const images = JSON.parse(p.images);
            const imgUrl = Array.isArray(images) ? images[0] : images;
            if (!imgUrl) continue; // Skip bad data

            const filename = imgUrl.split('/').pop();
            const filePath = path.join(UPLOADS_DIR, filename);

            if (!fs.existsSync(filePath)) {
                // File missing! Delete product.
                try {
                    await prisma.product.delete({ where: { id: p.id } });
                    process.stdout.write('x');
                    prunedCount++;
                } catch (e) {
                    if (e.code === 'P2003') {
                         // Soft delete or warn?
                         // If it's in an order, we can't delete. 
                         // We could mark it 'unavailable' if we had that field.
                         // For now, log warning.
                         // process.stdout.write('!'); 
                    }
                }
            }
        } catch (e) {
            console.error('Error checking product:', p.id, e);
        }
    }
    console.log(`\n   ❌ Pruned ${prunedCount} products with missing files.`);


    // 2. SYNC SOURCE: Copy from Downloaded -> Uploads (and Add to DB)
    console.log('\n📥 Step 2: Importing New Files from Source...');
    
    if (fs.existsSync(SOURCE_DIR)) {
        const genres = fs.readdirSync(SOURCE_DIR);
        let importedCount = 0;

        for (const genreRaw of genres) {
            const genreLower = genreRaw.toLowerCase();
            if (genreLower.includes('named_images')) continue; // Skip meta folder

            const genrePath = path.join(SOURCE_DIR, genreRaw);
            if (!fs.statSync(genrePath).isDirectory()) continue;

            const categoryName = categoryMap[genreLower] || genreRaw.charAt(0).toUpperCase() + genreRaw.slice(1);
            
            const files = fs.readdirSync(genrePath);
            
            for (const file of files) {
                if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

                const srcPath = path.join(genrePath, file);
                const uniqueName = `${categoryName.replace(/\s+/g, '_')}-${file}`;
                const destPath = path.join(UPLOADS_DIR, uniqueName);

                // Copy if not exists
                if (!fs.existsSync(destPath)) {
                    fs.copyFileSync(srcPath, destPath);
                }

                // Ensure in DB
                let titleRaw = path.basename(file, path.extname(file)).replace(/[-_]/g, ' ');
                const title = titleRaw.replace(/\b\w/g, l => l.toUpperCase());
                const imageUrl = `${SERVER_URL}/${uniqueName}`;

                // Check DB
                const existing = await prisma.product.findFirst({
                    where: { title: title, category: categoryName }
                });

                if (!existing) {
                    await prisma.product.create({
                        data: {
                            title: title,
                            description: `Classic ${categoryName} poster.`,
                            price: 399,
                            images: JSON.stringify([imageUrl]),
                            category: categoryName,
                            tags: JSON.stringify([categoryName.toLowerCase(), "imported"]),
                        }
                    });
                    process.stdout.write('+');
                    importedCount++;
                }
            }
        }
        console.log(`\n   ✅ Imported ${importedCount} new items.`);
    }

    console.log('\n✨ Catalog Sync Complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
