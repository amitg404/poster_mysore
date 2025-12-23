const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SOURCE_DIR = path.join('D:', 'Work_Dir', 'Projects', 'poster_mysore', 'pinterest_scraper', 'downloaded_images');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const SERVER_URL = 'http://localhost:5000/uploads';

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

async function main() {
    console.log('🚨 STARTING FULL CATALOG RESET 🚨');
    console.log('1️⃣  Wiping Uploads Folder...');
    
    // 1. Wipe Uploads
    if (fs.existsSync(UPLOADS_DIR)) {
        fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(UPLOADS_DIR);
    console.log('   ✅ Uploads folder cleared.');

    // 2. Clear Database
    console.log('2️⃣  Clearing Database Products...');
    try {
        const deleteInfo = await prisma.product.deleteMany({});
        console.log(`   ✅ Deleted ${deleteInfo.count} products from DB.`);
    } catch (e) {
        if (e.code === 'P2003') {
             console.log('   ⚠️ Some products could not be deleted (Foreign Key Constraint - likely in Orders). They remain in DB but their images are gone.');
        } else {
             console.error('   ❌ Database clear error:', e);
        }
    }

    // 3. Import New
    console.log('3️⃣  Importing from Source...');
    
    if (fs.existsSync(SOURCE_DIR)) {
        const genres = fs.readdirSync(SOURCE_DIR);
        let importedCount = 0;

        for (const genreRaw of genres) {
            const genreLower = genreRaw.toLowerCase();
            if (genreLower.includes('named_images')) continue; 

            const genrePath = path.join(SOURCE_DIR, genreRaw);
            if (!fs.statSync(genrePath).isDirectory()) continue;

            const categoryName = categoryMap[genreLower] || genreRaw.charAt(0).toUpperCase() + genreRaw.slice(1);
            console.log(`   📂 Importing Category: ${categoryName}`);
            
            const files = fs.readdirSync(genrePath);
            
            for (const file of files) {
                if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

                const srcPath = path.join(genrePath, file);
                const uniqueName = `${categoryName.replace(/\s+/g, '_')}-${file}`;
                const destPath = path.join(UPLOADS_DIR, uniqueName);

                // Copy
                fs.copyFileSync(srcPath, destPath);

                // Create DB Entry
                let titleRaw = path.basename(file, path.extname(file)).replace(/[-_]/g, ' ');
                const title = titleRaw.replace(/\b\w/g, l => l.toUpperCase());
                const imageUrl = `${SERVER_URL}/${uniqueName}`;

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
                process.stdout.write('.');
                importedCount++;
            }
            console.log('');
        }
        console.log(`\n🎉 Reset & Import Complete! Added ${importedCount} items.`);
    } else {
        console.error('❌ Source directory not found!');
    }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
