require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("\n🔍 Inspecting 'Luffy Crew Bundle'...");
    const bundle = await prisma.product.findMany({
        where: { title: { contains: 'Luffy Crew', mode: 'insensitive' } }
    });
    console.log(JSON.stringify(bundle, null, 2));
}

main()
  .finally(async () => await prisma.$disconnect());
