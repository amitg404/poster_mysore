require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("\n🔍 Inspecting One Random Product...");
    const product = await prisma.product.findFirst({
        where: { NOT: { category: 'Bundles' } } // Avoid bundles
    });
    
    if (product) {
        console.log("ID:", product.id);
        console.log("Title:", product.title);
        console.log("Category:", product.category);
        console.log("Tags (Raw):", product.tags);
        console.log("Image URL:", product.images ? JSON.parse(product.images)[0] : "None");
        try {
             // Check if tags is JSON containing rich metadata
             const parsedTags = JSON.parse(product.tags);
             console.log("Parsed Tags:", parsedTags);
        } catch (e) {
             console.log("Tags is NOT valid JSON (likely simpler CSV string).");
        }
    } else {
        console.log("No products found.");
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
