const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Fetch all products to broaden search for Supercars
    const allProducts = await prisma.product.findMany({
        select: { id: true, title: true, category: true }
    });

    const potentialSupercars = allProducts.filter(p => {
        const t = p.title.toLowerCase();
        return t.includes('porsche') || 
               t.includes('lambo') || 
               t.includes('ferrari') || 
               t.includes('mclaren') || 
               t.includes('bugatti') || 
               t.includes('koenisegg') || 
               t.includes('gtr') || // GTR might be its own bundle, but maybe checks?
               t.includes('audi') || 
               t.includes('bmw') || 
               t.includes('mercedes') ||
               t.includes('supercar') ||
               t.includes('vehicle') ||
               t.includes('car');
    });

    console.log(`Found ${potentialSupercars.length} potential supercars.`);
    potentialSupercars.forEach(p => console.log(`[${p.category}] ${p.title}`));
}

main();
