require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const RULES = [
    { cat: 'Car', keywords: ['Nissan', 'Skyline', 'GTR', 'GT-R', 'Porsche', 'BMW', 'Mercedes', 'Audi', 'Toyota', 'Supra', 'Lamborghini', 'Ferrari', 'McLaren', 'Bugatti', 'JDM'] },
    { cat: 'Anime', keywords: ['Luffy', 'Zoro', 'Sanji', 'Nami', 'Usopp', 'One Piece', 'Naruto', 'Sasuke', 'Goku', 'Vegeta', 'Dragon Ball', 'Demon Slayer', 'Tanjiro', 'Nezuko', 'Jujutsu Kaisen', 'Gojo', 'Sukuna', 'Attack on Titan', 'Eren', 'Levi', 'Robot Tsunami', 'Robot'] },
    { cat: 'Superheros', keywords: ['Batman', 'Joker', 'Superman', 'Spiderman', 'Iron Man', 'Captain America', 'Thor', 'Hulk', 'Marvel', 'DC', 'Avengers'] },
    { cat: 'Movie', keywords: ['Godfather', 'Pulp Fiction', 'Fight Club', 'Interstellar', 'Inception', 'Matrix', 'Star Wars'] },
    { cat: 'Nature', keywords: ['Salvador', 'Brazil', 'Tropical', 'Plant', 'Leaf', 'Flower', 'Garden', 'Forest', 'Mountain', 'Landscape', 'Nature', 'Botanical'] },
    { cat: 'Abstact', keywords: ['Abstract', 'Pattern', 'Geometric', 'Bauhaus'] }
];

async function main() {
    console.log("🚀 Starting Category Fixer & Title Cleaner (Aggressive)...");

    // 0. DELETE "ROBOT TSUNAMI" (User Request)
    console.log("🗑️ Deleting 'Robot Tsunami' products...");
    const tsunami = await prisma.product.deleteMany({
        where: { title: { contains: 'Robot Tsunami', mode: 'insensitive' } }
    });
    console.log(`✅ Deleted ${tsunami.count} Robot Tsunami items.`);
    
    // 1. CLEAN TITLES & FIX CATEGORIES
    const products = await prisma.product.findMany();
    console.log(`Checking ${products.length} products...`);
    let updatedCount = 0;

    for (const p of products) {
        let newTitle = p.title;
        let needsUpdate = false;

        // DEBUG: Find the One Piece Bundle Title
        if (p.title.toLowerCase().includes('one piece')) {
            console.log(`[DEBUG] Found One Piece Item: "${p.title}" | Category: ${p.category}`);
        }

        if (p.category === 'Bundles') {
            // PROTECT BUNDLES: Do not re-categorize them based on keywords
            // But check if it SHOULD be a bundle (has "Bundle" in title)
            // For now, trust existing 'Bundles' category.
            continue; 
        }

        // Clean Title
        const cleanTitle = p.title
            .replace(/(\.jpg|\.jpeg|\.png|\.webp)/gi, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b(Poster|Postcard|Print|Wall Art)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (cleanTitle !== p.title) {
            newTitle = cleanTitle;
            needsUpdate = true;
        }

        // Fix Category
        for (const rule of RULES) {
            if (rule.keywords.some(k => newTitle.toLowerCase().includes(k.toLowerCase()))) {
                if (p.category !== rule.cat) {
                    newCategory = rule.cat;
                    needsUpdate = true;
                }
                break; 
            }
        }
        
        if (newTitle.toLowerCase().includes('avengers bundle') || 
            newTitle.toLowerCase().includes('one piece gang') || 
            newTitle.toLowerCase().includes('luffy crew wanted posters') ||
            newTitle.toLowerCase().includes('crew posters')) {
             newCategory = 'Bundles';
             needsUpdate = true;
        }

        if (needsUpdate) {
            const finalCat = newCategory || p.category;
            // console.log(`🔧 Fixing: "${p.title}" -> "${newTitle}"`);
            await prisma.product.update({
                where: { id: p.id },
                data: { title: newTitle, category: finalCat }
            });
            updatedCount++;
        }
    }
    console.log(`✅ Cleaned/Fixed ${updatedCount} products.`);
    
    // 2. AGGRESSIVE DUPLICATE REMOVAL
    console.log("\n🧹 Checking for duplicates (Aggressive Mode)...");
    const allProducts = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
    });
    
    const productMap = new Map();
    let deleteCount = 0;

    for (const p of allProducts) {
        // Strict Key: e.g. "acdc live highway to hell|band"
        // Remove ALL non-alphanumeric chars for title comparison
        const normTitle = p.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        // const normCat = p.category.toLowerCase().trim();
        // IGNORE Category in key to find cross-category duplicates (e.g. Car vs Nature)
        const key = normTitle; 

        if (productMap.has(key)) {
            const existing = productMap.get(key);
            
            // Deciding which to delete
            let keepExisting = true;
            
            const pImgs = JSON.parse(p.images).length || 0;
            const eImgs = JSON.parse(existing.images).length || 0;
            
            // 1. Keep Bundle (more images)
            if (pImgs > eImgs + 1) { // significantly more images
                 keepExisting = false; 
            } else if (eImgs > pImgs + 1) {
                 keepExisting = true;
            } else {
                 // 2. Keep Shorter Title (cleaner)
                 if (p.title.length < existing.title.length) keepExisting = false;
                 // 3. Keep Bundle Category if Title same
                 else if (p.category === 'Bundles' && existing.category !== 'Bundles') keepExisting = false;
            }

            if (keepExisting) {
                console.log(`🗑️ Deleting Duplicate: "${p.title}" (Keeping "${existing.title}")`);
                await prisma.product.delete({ where: { id: p.id } });
                deleteCount++;
            } else {
                console.log(`🗑️ Deleting Duplicate (Worse): "${existing.title}" (Keeping "${p.title}")`);
                await prisma.product.delete({ where: { id: existing.id } });
                productMap.set(key, p);
                deleteCount++;
            }
        } else {
            productMap.set(key, p);
        }
    }
    console.log(`\n🎉 Aggressive Cleanup Complete! Deleted ${deleteCount} duplicates.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
