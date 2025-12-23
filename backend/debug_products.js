require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Checking 'Nature' Category Products...");
    const natureProducts = await prisma.product.findMany({
        where: { category: 'Nature' },
        select: { id: true, title: true, images: true, category: true }
    });
    
    console.log(`Found ${natureProducts.length} products in Nature:`);
    natureProducts.forEach(p => {
        console.log(`- [${p.id}] ${p.title} (Images: ${p.images})`);
    });

    console.log("\n🔍 Checking for Duplicates (by Title)...");
    const allProducts = await prisma.product.findMany({
        select: { title: true, category: true }
    });
    
    const seen = new Set();
    const duplicates = [];
    allProducts.forEach(p => {
        const key = `${p.category}-${p.title}`;
        if (seen.has(key)) duplicates.push(key);
        seen.add(key);
    });

    if (duplicates.length > 0) {
        console.log("⚠️ Found Duplicates:", duplicates);
    } else {
        console.log("✅ No exact Title+Category duplicates found.");
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
