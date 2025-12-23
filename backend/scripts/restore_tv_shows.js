const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function restoreTVShows() {
    console.log("🛠️ Starting Restoration for 'TV Shows'...");

    // 1. Read Metadata
    const metaPath = path.join(__dirname, '../../pinterest_scraper/poster_metadata.json');
    if (!fs.existsSync(metaPath)) {
        console.error("❌ Metadata file not found!");
        return;
    }
    const data = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    // The keys are IDs, values are the objects
    const metadata = Object.values(data);
    
    // 2. Filter TV Shows
    const tvShowsParams = metadata.filter(m => 
        (m.ai_analysis?.sub_category && m.ai_analysis.sub_category.toLowerCase() === 'tv shows') || 
        (m.category && m.category.toLowerCase() === 'tv shows')
    );
    console.log(`Found ${tvShowsParams.length} TV Shows in metadata.`);

    // 3. Process & Restore
    let restoredCount = 0;
    const CLOUDINARY_BASE = "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766043681/postershop";

    for (const item of tvShowsParams) {
        // Construct Title & ID
        let title = item.visual_description ? item.visual_description.substring(0, 50).split('.')[0] : null;
        
        let filename = item.id; 
        if (!filename) {
             // Fallback
             filename = title ? title.toLowerCase().replace(/[^a-z0-9]/g, '_') : `tv_show_${crypto.randomBytes(4).toString('hex')}`;
        } else {
             filename = filename.replace(/ /g, '_').toLowerCase();
        }

        // If title is missing or generic, use filename/ID
        if (!title || title === "TV Show Poster") {
            title = filename.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        
        // Ensure uniqueness for checking
        // Actually, we should check by ID in metadata to be sure.
        // But we are checking DB existence.


        // Construct Cloudinary URL
        // EXPECTED: .../tv_shows/TV_Shows-filename.jpg (or similar)
        // My previous standard was: category-filename.
        // So for "TV Shows", prefix is "TV_Shows-".
        // Folder is "tv_shows".
        
        const categoryPrefix = "TV_Shows"; // As per standard
        // Ensure filename doesn't already allow start with it
        let baseName = filename;
        if (baseName.startsWith('tv_shows-')) baseName = baseName.replace('tv_shows-', '');
        
        // Final name
        const finalName = `${categoryPrefix}-${baseName}.jpg`;
        const imageUrl = `${CLOUDINARY_BASE}/tv_shows/${finalName}`;

        // Check if exists in DB
        // console.log(`Checking existence for: ${title}`);
        const exists = await prisma.product.findFirst({
            where: {
                OR: [
                    { title: title },
                    { images: { contains: baseName } }
                ]
            }
        });

        if (exists) {
            console.log(`Skipping existing: ${title}`);
            continue;
        }

        console.log(`Restoring: ${title} (${finalName})`);
        
        // Insert
        try {
            await prisma.product.create({
                data: {
                    title: title,
                    description: item.visual_description || "TV Show Poster",
                    price: 299, // Default
                    category: "TV Shows",
                    tags: "TV Shows, Poster, Series",
                    images: JSON.stringify([imageUrl]),
                    stock: 100,
                    rating: 4.5
                }
            });
            console.log(`✅ Restored: ${title}`);
            restoredCount++;
        } catch (e) {
            console.error(`Failed to restore ${title}`, e.message);
        }
    }

    console.log(`\n🎉 Restore Complete. Added ${restoredCount} items.`);
    await prisma.$disconnect();
}

restoreTVShows();
