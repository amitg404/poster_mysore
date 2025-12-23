const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
    const categories = await prisma.product.groupBy({
        by: ['category'],
        _count: {
            category: true
        }
    });
    console.log(categories);
    await prisma.$disconnect();
}

checkCategories();
