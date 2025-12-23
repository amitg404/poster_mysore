const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const BUNDLE_SPECS = [
    { title: 'Anime Collection', searchFolder: 'postershop/anime', searchTerm: 'anime', targetCat: 'Bundles' },
    { title: 'Movie Classics', searchFolder: 'postershop/movie', searchTerm: 'movie', targetCat: 'Bundles' },
    { title: 'F1 Racing Legends', searchFolder: 'postershop/sports', searchTerm: 'f1', targetCat: 'Bundles' }, // F1 often under sports? Or f1 folder?
    { title: 'Superhero Squad', searchFolder: 'postershop/superheroes', searchTerm: 'superhero', targetCat: 'Bundles' }, // often 'superheroes' folder?
    { title: 'Music Icons', searchFolder: 'postershop/music', searchTerm: 'music', targetCat: 'Bundles' }
];

async function getImagesFromCloudinary(folder, term, limit = 6) {
    try {
        console.log(`☁️ Fetching from Cloudinary: Folder='${folder}'`);
        // We use the Search API for better filtering
        const result = await cloudinary.search
            .expression(`folder:${folder}/* AND resource_type:image`)
            .sort_by('created_at', 'desc')
            .max_results(limit * 2) // Fetch extra to shuffle
            .execute();

        const resources = result.resources;
        if (!resources || resources.length === 0) {
            console.warn(`   ⚠️ No images found in ${folder}. Trying fallback search...`);
            // Fallback: Broad search if folder fails
             const fallback = await cloudinary.search
                .expression(`${term} AND resource_type:image`)
                .max_results(limit)
                .execute();
             return fallback.resources.map(r => r.secure_url);
        }

        // Shuffle and pick
        const shuffled = resources.sort(() => 0.5 - Math.random()).slice(0, limit);
        return shuffled.map(r => r.secure_url);

    } catch (e) {
        console.error(`   ❌ Cloudinary Error for ${folder}:`, e.message);
        return [];
    }
}

async function main() {
    try {
        console.log("🔥 Flushing old 'Bundles'...");
        await prisma.product.deleteMany({
            where: { category: { contains: 'Bundles' } }
        });
        console.log("✅ Old bundles deleted.");

        // Create Golden Bundles
        for (const spec of BUNDLE_SPECS) {
            console.log(`🔨 Constructing: ${spec.title}...`);

            // 1. Get Images directly from Cloudinary (Source of Truth)
            let images = await getImagesFromCloudinary(spec.searchFolder, spec.searchTerm, 6);
            
            // Fallback for tricky folders if empty
            if (images.length < 6) {
                 // Try mapping some common folder variations
                 if(spec.title.includes('F1')) images = await getImagesFromCloudinary('postershop/f1', 'f1', 6);
                 if(spec.title.includes('Super')) images = await getImagesFromCloudinary('postershop/superheros', 'superhero', 6);
            }

            if (images.length < 6) {
                console.warn(`⚠️ Skipping ${spec.title}: Not enough images (${images.length}/6).`);
                continue;
            }

            // 2. Create Bundle Product
            await prisma.product.create({
                data: {
                    title: spec.title,
                    description: `Get 6 premium ${spec.searchTerm} posters for just ₹299! Best value pack.`,
                    price: 299,
                    category: 'Bundles',
                    images: JSON.stringify(images),
                    tags: JSON.stringify(['Bundle', 'Value', spec.searchTerm]),
                    isAvailable: true,
                    stock: 100
                }
            });
            console.log(`✅ Created ${spec.title} with ${images.length} images.`);
        }

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
