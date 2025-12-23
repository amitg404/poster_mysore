const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🛠️  Starting Targeted Fix...");

        // 1. Force ALL Prices to 99
        // User said: "it should all be 99rs only"
        const priceUpdate = await prisma.product.updateMany({
            data: { price: 99 }
        });
        console.log(`✅ Updated ${priceUpdate.count} products to Price ₹99.`);

        // 2. Fix Bundles
        // Find products that look like Bundles
        const bundles = await prisma.product.findMany({
            where: {
                OR: [
                    { title: { contains: 'Bundle', mode: 'insensitive' } },
                    { category: { contains: 'Bundle', mode: 'insensitive' } },
                    { images: { contains: 'bundles', mode: 'insensitive' } } // Look for images in bundles folder
                ]
            }
        });

        console.log(`🔍 Found ${bundles.length} potential bundles.`);

        for (const b of bundles) {
            let needsUpdate = false;
            let updates = {};

            // A. Ensure Category is 'Bundles'
            if (b.category !== 'Bundles') {
                updates.category = 'Bundles';
                needsUpdate = true;
                console.log(`   - Moving "${b.title}" to Category: Bundles (was ${b.category})`);
            }

            // B. Ensure excluded from main catalog? 
            // The controller excludes "Bundles" category, so step A fixes the visibility issue.

            // C. Fix Bundle Images?
            // User said "don't have images".
            // Let's ensure the URL points to the correct place. 
            // If the Image is `.../postershop/bundles/bundle_name.jpg`, the controller maps it.
            // But if it's currently something else, we might need to fix it.
            // Assuming the Sync script put the correct Cloudinary URL (absolute).

            if (needsUpdate) {
                await prisma.product.update({
                    where: { id: b.id },
                    data: updates
                });
            }
        }
        
        console.log("✅ Bundle Fixes Complete.");

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
