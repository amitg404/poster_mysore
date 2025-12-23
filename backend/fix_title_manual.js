const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log("Fixing Zenitsu titles...");
    
    // Find products with the bad title
    const products = await prisma.product.findMany({
        where: { title: { contains: 'zenitsuagatsuma', mode: 'insensitive' } }
    });

    for (const p of products) {
        // Simple manual fix map for this specific case
        let newTitle = p.title;
        if (p.title.includes('zenitsuagatsumathunderbreathing')) {
            newTitle = p.title.replace('zenitsuagatsumathunderbreathing', 'Zenitsu Agatsuma Thunder Breathing');
            // Also capitalize 'anime' if present
            newTitle = newTitle.replace('anime', 'Anime');
        }

        if (newTitle !== p.title) {
            await prisma.product.update({
                where: { id: p.id },
                data: { title: newTitle }
            });
            console.log(`✅ Updated: "${p.title}" -> "${newTitle}"`);
        }
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
