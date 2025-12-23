const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log("Applying Manual Title Fixes...");

    // Map of bad -> good
    const fixes = {
        'ohmygoodness': 'Oh My Goodness',
        'venomvigilantebatman': 'Venom Vigilante Batman',
        'backtothefuture': 'Back To The Future',
        'everyrepbuildsyou': 'Every Rep Builds You',
        'playstation': 'PlayStation',
        'interstellar': 'Interstellar',
        'oppenheimer': 'Oppenheimer',
        'wildflowers': 'Wildflowers',
        'anime zenitsuagatsumathunderbreathing': 'Anime Zenitsu Agatsuma Thunder Breathing' // Just in case
    };

    let updatedCount = 0;

    for (const [bad, good] of Object.entries(fixes)) {
        // Find by exact match or substring if needed. 
        // For 'venomvigilantebatman', it's unique enough.
        
        const products = await prisma.product.findMany({
            where: { title: { equals: bad, mode: 'insensitive' } }
        });

        for (const p of products) {
            if (p.title !== good) {
                await prisma.product.update({
                    where: { id: p.id },
                    data: { title: good }
                });
                console.log(`✅ Fixed: "${p.title}" -> "${good}"`);
                updatedCount++;
            }
        }
    }
    
    // Also General Fix: Capitalize first letter of short single-word titles if they are lowercase
    const singleWords = await prisma.product.findMany({
        where: { NOT: { title: { contains: ' ' } } }
    });
    
    for (const p of singleWords) {
        if (p.title[0] && p.title[0] === p.title[0].toLowerCase()) {
             const capitalized = p.title.charAt(0).toUpperCase() + p.title.slice(1);
             // Skip if it's one of the manual fixes we just handled (though checking won't hurt)
             if (!Object.values(fixes).includes(capitalized)) {
                 await prisma.product.update({
                    where: { id: p.id },
                    data: { title: capitalized }
                 });
                 console.log(`✅ Capitalized: "${p.title}" -> "${capitalized}"`);
                 updatedCount++;
             }
        }
    }

    console.log(`\nTotal Updates: ${updatedCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
