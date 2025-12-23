const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Dumping Product Data...");
    // Fetch 5 random products to inspect
    const products = await prisma.product.findMany({ 
        take: 5,
        select: { id: true, title: true, category: true, tags: true } 
    });
    console.log(JSON.stringify(products, null, 2));

    // Test a reliable query
    const test = await prisma.product.findMany({
        where: { category: { contains: 'Anime' } }
    });
    console.log("Test 'Anime' Match Count:", test.length);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
