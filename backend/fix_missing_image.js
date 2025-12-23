const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixImage() {
    console.log("🛠️ Fixing missing image...");
    
    // Find the product with the broken link
    const product = await prisma.product.findFirst({
        where: { title: "Minimalist Mountain" }
    });

    if (!product) {
        console.log("❌ Product 'Minimalist Mountain' not found.");
        return;
    }

    // Update to a real file
    // We found "Minimalist-minimalist_poster.jpg" in the uploads folder listing
    const validImage = "/uploads/Minimalist-minimalist_poster.jpg";
    
    await prisma.product.update({
        where: { id: product.id },
        data: { images: JSON.stringify([validImage]) }
    });

    console.log(`✅ Updated product '${product.title}' to use image: ${validImage}`);
    await prisma.$disconnect();
}

fixImage();
