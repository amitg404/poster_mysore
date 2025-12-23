const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const bundles = await prisma.product.findMany({
        where: { category: 'Bundles' },
        select: { id: true, title: true, price: true, images: true }
    });
    
    console.log(`Found ${bundles.length} items in 'Bundles' category.`);
    console.log("---------------------------------------------------");
    bundles.forEach(b => {
        // Parse images to count them
        let imgCount = 0;
        try {
            const parsed = JSON.parse(b.images);
            imgCount = Array.isArray(parsed) ? parsed.length : 1;
        } catch(e) {}
        
        console.log(`[${b.id}] ${b.title} | Price: ${b.price} | Images: ${imgCount}`);
    });
}

main();
