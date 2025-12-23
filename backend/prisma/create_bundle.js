const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("📦 Creating Mega Bundle (10 Posters)...");

    // Define the Mega Bundle Product
    const bundleProduct = {
        title: "Mystery Mega Bundle (10 Pack)",
        description: "A comprehensive collection of 10 premium posters. Best value for serious collectors or room makeovers. Includes a mix of Anime, Movies, and Abstract art.",
        price: 649, // Deal Price
        images: JSON.stringify(["/assets/bundle_cover.jpg"]), // Placeholder image, logic needs a real asset or we use a generic one
        category: "Bundles",
        tags: JSON.stringify(["bundle", "sale", "mystery", "10pack"]),
        stock: 50
    };

    // Check if it already exists to avoid duplicates
    const existing = await prisma.product.findFirst({
        where: { title: bundleProduct.title }
    });

    if (existing) {
        console.log("⚠️ Mega Bundle already exists. Updating price/details...");
        await prisma.product.update({
            where: { id: existing.id },
            data: bundleProduct
        });
        console.log("✅ Updated Mega Bundle.");
    } else {
        await prisma.product.create({
            data: bundleProduct
        });
        console.log("✅ Created brand new Mega Bundle.");
    }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
