const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const product = await prisma.product.findFirst({
        where: { title: 'Music Icons' }
    });
    
    if (product) {
        console.log("Title:", product.title);
        console.log("Images Raw:", product.images);
        try {
            console.log("Images Parsed:", JSON.parse(product.images));
        } catch(e) {
            console.log("Images Parse Error");
        }
    } else {
        console.log("Product not found");
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
