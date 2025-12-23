const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting Deduplication...');

  // 1. Fetch all products
  const products = await prisma.product.findMany({
    select: { id: true, title: true, category: true }
  });

  console.log(`📊 Total products scanned: ${products.length}`);

  const seen = new Set();
  const duplicates = [];

  // 2. Identify duplicates
  for (const product of products) {
    // Normalize key: title + category (to be safe)
    const key = `${product.title.toLowerCase().trim()}|${product.category.toLowerCase().trim()}`;
    
    if (seen.has(key)) {
      duplicates.push(product.id);
    } else {
      seen.add(key);
    }
  }

  console.log(`⚠️ Found ${duplicates.length} duplicates.`);

  if (duplicates.length > 0) {
    // 3. Delete duplicates
    const result = await prisma.product.deleteMany({
      where: {
        id: { in: duplicates }
      }
    });

    console.log(`✅ Deleted ${result.count} duplicate products.`);
  } else {
    console.log('✨ No duplicates found. Database is clean.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
