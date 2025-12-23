const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const id = "1a560a99-024f-4b50-a41c-09065e1794b4";
    console.log(`Checking Product: ${id}`);
    
    const product = await prisma.product.findUnique({
        where: { id: id }
    });

    if (!product) {
        console.log("❌ Product NOT found in Prisma.");
    } else {
        console.log("✅ Product Found.");
        console.log("Images Field Type:", typeof product.images);
        console.log("Images Value:", product.images);
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
