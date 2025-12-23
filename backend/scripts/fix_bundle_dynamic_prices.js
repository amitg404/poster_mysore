const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🛠️  Fixing Bundle Prices based on Name...");

        // Find all Bundles
        const bundles = await prisma.product.findMany({
            where: {
                category: 'Bundles'
            }
        });

        console.log(`🔍 Found ${bundles.length} bundles.`);

        for (const b of bundles) {
            // Logic: Look for a number at the end of the title.
            // Example: "F1 Teams 479" -> 479
            // Example: "Avengers Bundle 999" -> 999
            
            // Regex to find 3 or 4 digits at the end of the string
            const priceMatch = b.title.match(/(\d{3,5})$/);
            
            if (priceMatch) {
                const newPrice = parseInt(priceMatch[1]);
                if (b.price !== newPrice) {
                    console.log(`   - Updating "${b.title}": ₹${b.price} -> ₹${newPrice}`);
                    await prisma.product.update({
                        where: { id: b.id },
                        data: { price: newPrice }
                    });
                } else {
                     console.log(`   - "${b.title}" is already correct (₹${newPrice})`);
                }
            } else {
                console.log(`   ⚠️  No price found in title for "${b.title}". ID: ${b.id}`);
            }
        }
        
        console.log("✅ Bundle Price Fixes Complete.");

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
