const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTVShows() {
    const products = await prisma.product.findMany({
        where: {
            category: { contains: 'TV Shows' }
        },
        select: { id: true, title: true, images: true, category: true }
    });

    console.log(`Found ${products.length} products matching 'TV Shows'`);
    
    products.forEach(p => {
        let images = JSON.parse(p.images);
        if (!Array.isArray(images)) images = [images];
        console.log(`[${p.id}] ${p.title} -> ${images[0]}`);
    });
    
    await prisma.$disconnect();
}

checkTVShows();
