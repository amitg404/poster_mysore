
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating F1 Bundle Price...");
  
  // 1. Find F1 Bundle
  const f1 = await prisma.product.findFirst({
    where: { title: { contains: 'F1 Bundle', mode: 'insensitive' } }
  });

  if (!f1) {
    console.error("❌ F1 Bundle not found!");
    return;
  }

  console.log(`Found: ${f1.title} - Current Price: ${f1.price}`);

  // 2. Update to 479
  const updated = await prisma.product.update({
    where: { id: f1.id },
    data: { price: 479 }
  });

  console.log(`✅ Updated to: ${updated.price}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
