const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapping for clean category names (Same as import script)
const categoryMap = {
    'anime': 'Anime',
    'abstract': 'Abstract',
    'band': 'Band',
    'cars': 'Cars',
    'gaming': 'Gaming',
    'geometric art': 'Geometric Art',
    'japanese art': 'Japanese Art',
    'minimalist': 'Minimalist',
    'motivational': 'Motivational',
    'movie': 'Movie',
    'music': 'Music',
    'nature': 'Nature',
    'retro': 'Retro',
    'sci-fi': 'Sci-Fi',
    'space': 'Space',
    'sports': 'Sports',
    'superheros': 'Superheros',
    'tv shows': 'TV Shows',
    'vintage': 'Vintage',
    'my_creations': 'My Creations'
};
const allowedCategories = Object.values(categoryMap);

async function main() {
  console.log('🧹 Starting Smart Deduplication...');

  const allProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' } // Oldest first
  });

  console.log(`🔍 Scanned ${allProducts.length} products.`);

  // Group by Title (normalized) to find duplicates
  const grouped = {};
  
  for (const p of allProducts) {
      const titleKey = p.title.trim().toLowerCase();
      if (!grouped[titleKey]) grouped[titleKey] = [];
      grouped[titleKey].push(p);
  }

  let deletedCount = 0;
  let updatedCount = 0;

  for (const title of Object.keys(grouped)) {
      const group = grouped[title];
      
      // If we have duplicates
      if (group.length > 1) {
          // Keep the first one (Oldest), delete the rest
          const toKeep = group[0];
          const toDelete = group.slice(1);

          for (const p of toDelete) {
              try {
                  await prisma.product.delete({ where: { id: p.id } });
                  process.stdout.write('x');
                  deletedCount++;
              } catch (e) {
                  // If we can't delete (FK violation), we are in a pickle.
                  // But usually the NEW (duplicate) one is NOT in a cart.
                  // If the NEW one is in a cart, we might have to swap strategies.
                  // But let's assume New = Empty for now.
                  console.error(`\n⚠️ Failed to delete duplicate ${p.id}: ${e.code}`);
              }
          }
          
          // Now ensure the kept one has the correct category casing
          const correctCategory = allowedCategories.find(c => c.toLowerCase() === toKeep.category.toLowerCase()) || toKeep.category;
          if (toKeep.category !== correctCategory) {
               await prisma.product.update({
                   where: { id: toKeep.id },
                   data: { category: correctCategory }
               });
               process.stdout.write('u');
               updatedCount++;
          }

      } else {
          // No duplicates, just normalize the category
          const toKeep = group[0];
          const correctCategory = allowedCategories.find(c => c.toLowerCase() === toKeep.category.toLowerCase()) || toKeep.category;
          
          if (toKeep.category !== correctCategory) {
             await prisma.product.update({
                 where: { id: toKeep.id },
                 data: { category: correctCategory }
             });
             process.stdout.write('-');
             updatedCount++;
          }
      }
  }

  console.log(`\n\n✅ Deduplication Complete.`);
  console.log(`🗑️ Deleted: ${deletedCount} duplicates.`);
  console.log(`✨ Updated: ${updatedCount} legacy categories.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
