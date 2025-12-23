const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Testing Bundles Exclusion...");
        // This corresponds to logic in lines 40-50 and 80-84
        await prisma.product.findMany({
            where: {
                category: { not: { contains: 'Bundles' } } 
            },
            take: 1
        });
        console.log("✅ Bundles Query Passed");

        console.log("Testing Category Preview (Frontend Landing Page)...");
        // Corresponds to lines 368-379
        await prisma.product.findMany({
            where: {
                category: { contains: 'Anime' } 
            },
            take: 1
        });
        console.log("✅ Preview Query Passed");

    } catch (e) {
        console.error("❌ Query Failed:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
