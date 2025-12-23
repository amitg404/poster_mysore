const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Searching for 'Custom Poster (Your Design)'...");
        const products = await prisma.product.findMany({
            where: {
                title: { contains: "Custom Poster (Your Design)", mode: 'insensitive' }
            }
        });

        if (products.length === 0) {
            console.log("No placeholder product found.");
        } else {
            console.log(`Found ${products.length} placeholder(s).`);
            for (const p of products) {
                console.log(`Deleting: ${p.title} (ID: ${p.id})`);
                await prisma.product.delete({ where: { id: p.id } });
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
