const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log("Scanning Titles...");
    
    const products = await prisma.product.findMany({
        select: { id: true, title: true }
    });
    
    const suspicious = products.filter(p => !p.title.includes(' ') && p.title.length > 10);
    
    console.log(`Found ${suspicious.length} suspicious titles (no spaces, >10 chars):`);
    suspicious.forEach(p => console.log(`- ${p.title} (${p.id})`));

    console.log("\nSample of other titles:");
    products.slice(0, 10).forEach(p => console.log(`- ${p.title}`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
