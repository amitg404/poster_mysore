const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('📉 Updating all product prices to ₹99...');
    try {
        const result = await prisma.product.updateMany({
            data: {
                price: 99
            }
        });
        console.log(`✅ Updated ${result.count} products to ₹99.`);
    } catch (e) {
        console.error('❌ Error updating prices:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
