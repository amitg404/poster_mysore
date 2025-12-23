const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProduct() {
    console.log("Searching for 'Saul Goodman'...");
    
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { title: { contains: 'Saul', mode: 'insensitive' } },
                { description: { contains: 'Saul', mode: 'insensitive' } },
                { images: { contains: 'saul', mode: 'insensitive' } }
            ]
        }
    });

    console.log(`Found ${products.length} matches.`);
    products.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`Title: ${p.title}`);
        console.log(`Category: '${p.category}'`);
        console.log(`Images: ${p.images}`);
        console.log('---');
    });
    
    await prisma.$disconnect();
}

checkProduct();
