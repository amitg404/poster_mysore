const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
    const item = await prisma.product.findFirst({
        where: { category: 'F1 Teams 479' }
    });
    if (item) {
        console.log("Found item:", item.title);
        console.log("Images:", item.images);
    } else {
        console.log("Item not found");
    }
    await prisma.$disconnect();
}

inspect();
