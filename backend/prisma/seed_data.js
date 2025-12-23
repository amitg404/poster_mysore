const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    console.log("🌱 Seeding Users & Products...");

    // 1. Create a Test User
    const password = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
        where: { mobile: '9876543210' },
        update: {},
        create: {
            name: 'Test Consumer',
            mobile: '9876543210',
            password,
            role: 'USER',
            isWhatsApp: true
        }
    });
    console.log(`👤 User created: ${user.name} (${user.mobile})`);

    // 2. Create Sample Products
    const productsData = [
        {
            title: "Neon City Scape",
            description: "A cyberpunk inspired city view.",
            price: 499,
            category: "Abstract",
            images: JSON.stringify(["/uploads/Abstract-neon_cityscape.jpg"]),
            tags: JSON.stringify(["neon", "cyberpunk", "city"]),
            stock: 50
        },
        {
            title: "Minimalist Mountain",
            description: "Simple lines forming a mountain range.",
            price: 399,
            category: "Minimalist",
            images: JSON.stringify(["/uploads/Minimalist-mountain_landscape.jpg"]), // Best guess or pick a real one like Minimalist-minimalist_poster.jpg if mountain missing
            tags: JSON.stringify(["minimal", "nature", "mountains"]),
            stock: 100
        },
        {
            title: "Akira Poster",
            description: "Classic anime movie poster.",
            price: 599,
            category: "Anime",
            images: JSON.stringify(["/uploads/Anime-akira_poster.jpg"]),
            tags: JSON.stringify(["anime", "retro", "90s"]),
            stock: 25
        },
        {
            title: "Astronaut in Space",
            description: "Space exploration art.",
            price: 450,
            category: "Space",
            images: JSON.stringify(["/uploads/Space-astronaut_in_space.jpg"]),
            tags: JSON.stringify(["space", "astronaut", "art"]),
            stock: 60
        },
        {
            title: "Gaming Controller",
            description: "Stylized gaming controller illustration.",
            price: 550,
            category: "Gaming",
            images: JSON.stringify(["/uploads/Gaming-gaming_controller.jpg"]),
            tags: JSON.stringify(["gaming", "controller", "videogames"]),
            stock: 40
        }
    ];

    for (const p of productsData) {
        await prisma.product.create({ data: p });
    }
    console.log(`🎨 ${productsData.length} Products created.`);

    console.log("✅ Seeding Complete!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
