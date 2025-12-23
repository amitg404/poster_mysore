const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    // Search for the problematic title
    const products = await prisma.product.findMany({
        where: {
            title: {
                contains: 'zenitsu', 
                mode: 'insensitive'
            }
        },
        take: 5
    });
    
    console.log("Found Products:", JSON.stringify(products, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
