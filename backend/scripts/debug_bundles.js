const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const bundles = await prisma.product.findMany({
        where: { 
            OR: [
                { category: { contains: 'undle', mode: 'insensitive' } },
                { title: { contains: 'undle', mode: 'insensitive' } }
            ]
        }
    });
    
    console.log(`Found ${bundles.length} bundles in Category 'Bundles'`);
    
    bundles.forEach(b => {
        console.log(`--------------------------------------------------`);
        console.log(`ID: ${b.id}`);
        console.log(`Title: ${b.title}`);
        console.log(`Price: ${b.price}`);
        console.log(`Image (Raw): ${b.images}`);
        
        // Parse Title or Folder for Price?
        // Let's see what the image URL looks like
    });
}

main();
