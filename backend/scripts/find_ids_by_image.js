const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const targets = [
        "vintage-vietnam_pavilion.jpg",
        "movie-spider_man_movie.jpg"
    ];

    console.log("🔍 Searching for products...");

    for (const filename of targets) {
        // Search inside the JSON string or just substring match
        const product = await prisma.product.findFirst({
            where: {
                images: {
                    contains: filename
                }
            }
        });

        if (product) {
            console.log(`✅ FOUND: ${filename}`);
            console.log(`   ID: ${product.id}`);
            console.log(`   Title: ${product.title}`);
        } else {
            console.log(`❌ NOT FOUND: ${filename}`);
        }
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
