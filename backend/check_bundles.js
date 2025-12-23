const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function check() {
    const bundles = await prisma.product.findMany({
        where: { category: 'Bundles' }
    });
    console.log("Bundles in DB:", bundles.length);
    bundles.forEach(b => console.log(` - ${b.title} (${b.price})`));
}

check();
