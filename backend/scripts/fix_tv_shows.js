const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCategories() {
    console.log("🛠️ Normalizing 'Tv Shows' -> 'TV Shows'...");

    const { count } = await prisma.product.updateMany({
        where: {
            category: { contains: 'Tv Shows' } // Matches case-insensitive often, but we want to update the actual string
        },
        data: {
            category: 'TV Shows'
        }
    });
    
    // Also check for 'Uncategorized' that are actually TV Shows? 
    // (Skipping for now as restore script put them as 'Tv Shows' mostly if they existed)

    console.log(`✅ Updated ${count} products.`);
    await prisma.$disconnect();
}

fixCategories();
