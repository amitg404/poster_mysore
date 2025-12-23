const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📉 Updating all prices to ₹99...');
  
  const result = await prisma.product.updateMany({
    data: {
      price: 99
    }
  });

  console.log(`✅ Updated ${result.count} products to ₹99.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
