require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("\n🔍 Finding Space/Abstract Poster...");
    
    const space = await prisma.product.findFirst({
        where: { category: { contains: 'Space', mode: 'insensitive' } }
    });
    
    const abstract = await prisma.product.findFirst({
        where: { category: { contains: 'Abstract', mode: 'insensitive' } }
    });

    if (space) console.log("Space:", space.images ? JSON.parse(space.images)[0] : "No img");
    if (abstract) console.log("Abstract:", abstract.images ? JSON.parse(abstract.images)[0] : "No img");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
