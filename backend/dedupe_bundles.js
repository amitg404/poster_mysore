require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Bundle Deduplication...");
    
    // 1. Get All Bundles
    const bundles = await prisma.product.findMany({
        where: { category: 'Bundles' }
    });
    console.log(`📦 Found ${bundles.length} Bundles.`);

    // Collect all Bundle Image URLs
    const bundleImages = new Set();
    for (const b of bundles) {
        try {
            const images = JSON.parse(b.images);
            images.forEach(img => bundleImages.add(img));
        } catch (e) {
            console.error(`❌ Failed to parse images for bundle ${b.title}`);
        }
    }
    console.log(`🖼️  Indexed ${bundleImages.size} images inside Bundles.`);

    // 2. Get All Single Products
    const singles = await prisma.product.findMany({
        where: { category: { not: 'Bundles' } }
    });
    console.log(`📄 Checking ${singles.length} Single Products...`);

    let deleteCount = 0;
    for (const p of singles) {
        try {
            const images = JSON.parse(p.images);
            // If the single product's main image is found in ANY bundle, delete it.
            // (Assumes exact URL match from Cloudinary)
            if (images.length > 0 && bundleImages.has(images[0])) {
                console.log(`🗑️ Deleting Redundant Single "${p.title}" (Found in Bundle)`);
                await prisma.product.delete({ where: { id: p.id } });
                deleteCount++;
            }
        } catch (e) {}
    }

    console.log(`\n🎉 Bundle Cleanup Complete! Deleted ${deleteCount} redundant single posters.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
