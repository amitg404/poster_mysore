```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const mobile = "9876543210";
    console.log("Seeding cart...");
    
    // 1. Get User
    const user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) {
        console.error("User not found! Run create_test_user.js first.");
        return;
    }

    // 2. Get 3 Products
    const products = await prisma.product.findMany({ take: 3 });
    if (products.length < 3) {
        console.error("Not enough products found.");
        return;
    }

    console.log(`Seeding cart for ${user.mobile} with 3 products...`);

    // 3. Clear existing cart
    await prisma.cartItem.deleteMany({ where: { userId: user.id } });

    // 4. Add items
    for (const p of products) {
        await prisma.cartItem.create({
            data: {
                userId: user.id,
                productId: p.id,
                quantity: 1
            }
        });
        console.log(`Added ${p.title} to cart.`);
    }

    console.log("✅ Cart seeded successfully!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
