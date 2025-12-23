const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    console.log("🔍 Verifying Data Integrity...");

    // 1. Check TV Shows
    const tvShows = await prisma.product.count({
        where: { category: 'TV Shows', isAvailable: true }
    });
    console.log(`📺 Active 'TV Shows' Count: ${tvShows} (Expected > 0)`);

    // 2. Check Japanese Art
    const japArt = await prisma.product.count({
        where: { category: 'Japanese Art', isAvailable: true }
    });
    console.log(`🎎 Active 'Japanese Art' Count: ${japArt} (Expected > 0)`);

    // 3. Check Bundle Prices
    const sampleBundle = await prisma.product.findFirst({
        where: { 
            category: 'Bundles',
            isAvailable: true 
        }
    });
    if (sampleBundle) {
        console.log(`📦 Sample Bundle: ${sampleBundle.title} - Price: ${sampleBundle.price}`);
    } else {
        console.log("⚠️ No Bundles found to check price.");
    }

    // 4. Check Regular Poster Price
    const samplePoster = await prisma.product.findFirst({
        where: { 
            category: { not: 'Bundles' },
            isAvailable: true 
        }
    });
    console.log(`🖼️  Sample Poster: ${samplePoster.title} - Price: ${samplePoster.price} (Expected 99)`);

    await prisma.$disconnect();
}

verify();
