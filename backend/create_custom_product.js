const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log("Creating Custom Product Placeholder...");
    
    // Check if exists
    const exists = await prisma.product.findUnique({
        where: { id: 'custom-poster-base' }
    });

    if (!exists) {
        await prisma.product.create({
            data: {
                id: 'custom-poster-base',
                title: 'Custom Poster (Your Design)',
                description: 'A custom poster printed with your own design.',
                price: 199,
                category: 'Custom',
                images: '[]',
                tags: '[]',
                stock: 9999,
                isAvailable: true
            }
        });
        console.log("✅ Created custom-poster-base");
    } else {
        console.log("ℹ️ custom-poster-base already exists.");
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
