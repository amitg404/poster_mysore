const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countCategories() {
  try {
    const products = await prisma.product.findMany({
      select: { category: true }
    });

    const categoryCounts = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    console.log("=== Poster Counts by Category ===");
    console.table(categoryCounts);
    
    // Also print total
    console.log(`\nTotal Posters: ${products.length}`);

  } catch (error) {
    console.error("Error counting categories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

countCategories();
