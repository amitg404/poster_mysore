const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        where: { category: { contains: 'Music' } },
        take: 20
    });

    console.log("--- Analyze Music Products ---");
    products.forEach(p => {
        const imgs = JSON.parse(p.images || '[]');
        const isPostershop = imgs.some(i => i.includes('postershop'));
        console.log(`ID: ${p.id.substring(0,8)} | Title: ${p.title.substring(0, 20)} | Has Postershop URL: ${isPostershop}`);
        if(isPostershop) console.log("   Example:", imgs[0]);
    });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
