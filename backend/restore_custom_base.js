const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const id = 'custom-poster-base';
    
    // Check if exists
    const existing = await prisma.product.findUnique({ where: { id } });
    if (existing) {
        console.log("Custom Base Product already exists.");
    } else {
        console.log("Creating Custom Base Product...");
        await prisma.product.create({
            data: {
                id: id,
                title: 'Custom Poster (Your Design)',
                description: 'A unique poster designed by you.',
                price: 199,
                category: 'Custom',
                images: JSON.stringify(['/assets/placeholder.png']), // Fallback image
                tags: '[]', // Required field
                stock: 9999
            }
        });
        console.log("Created successfully.");
    }
  } catch (e) {
    console.error("Error creating base product:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
