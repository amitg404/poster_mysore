const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (!process.env.CLOUDINARY_URL) {
    console.error("❌ CLOUDINARY_URL is missing from .env");
    process.exit(1);
}

cloudinary.config({ secure: true });

async function main() {
    try {
        console.log("🔥 Flushing old 'Bundles'...");
        await prisma.product.deleteMany({
            where: { category: { contains: 'Bundles' } }
        });
        console.log("✅ Old bundles deleted.");

        // Get Folders
        const root = 'postershop/bundles';
        const foldersRef = await cloudinary.api.sub_folders(root);
        const folders = foldersRef.folders;

        console.log(`📂 Found ${folders.length} Bundle Folders in Cloudinary.`);

        for (const folder of folders) {
            const folderName = folder.name; // e.g. "Avengers_479rs"
            console.log(`\nProcessing: ${folderName}`);

            // Parse Name and Price
            // Regex: Look for number followed by optional 'rs' at the end
            let title = folderName;
            let price = 299; // Default fallback

            const priceMatch = folderName.match(/_(\d+)(?:rs|Rs)?$/i);
            if (priceMatch) {
                price = parseInt(priceMatch[1]);
                title = folderName.replace(priceMatch[0], '').replace(/_/g, ' ').trim();
            } else {
                 title = folderName.replace(/_/g, ' ').trim();
            }

            // Fetch Images
            const result = await cloudinary.search
                .expression(`folder:"${folder.path}" AND resource_type:image`)
                .sort_by('public_id', 'asc')
                .max_results(500)
                .execute();
            
            const images = result.resources.map(r => r.secure_url);

            if (images.length === 0) {
                console.warn(`⚠️ Skipping ${title}: No images found.`);
                continue;
            }

            console.log(`   Title: "${title}"`);
            console.log(`   Price: ₹${price}`);
            console.log(`   Images: ${images.length}`);

            // Create Product
            await prisma.product.create({
                data: {
                    title: title,
                    description: `Exclusive ${title} collection. Includes ${images.length} premium posters.`,
                    price: price,
                    category: 'Bundles',
                    images: JSON.stringify(images),
                    tags: JSON.stringify(['Bundle', title, 'Value Pack']),
                    isAvailable: true,
                    stock: 50
                }
            });
            console.log(`   ✅ DB Record Created.`);
        }

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
