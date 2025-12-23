const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkJapaneseArt() {
    console.log("Searching for 'Japanese Art'...");
    
    // Check both potential category names if normalization isn't perfect
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { category: { contains: 'Japanese', mode: 'insensitive' } },
                { category: { contains: 'Japan', mode: 'insensitive' } }
            ]
        },
        select: { id: true, title: true, images: true }
    });

    console.log(`Found ${products.length} matches.`);
    products.forEach(p => {
        let imgs = [];
        try { imgs = JSON.parse(p.images); } catch(e) { imgs = [p.images]; }
        console.log(`[${p.id}] ${p.title} -> ${imgs[0]}`);
    });
    
    await prisma.$disconnect();
}

checkJapaneseArt();
