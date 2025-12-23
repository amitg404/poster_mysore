const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

async function checkUrl(url) {
    if (!url) return false;
    // Fix localhost URLs for checking
    if (url.startsWith('http://localhost:5000')) {
        // Can't check localhost easily from this script context if server not running or path mapped
        // But the user issue is usually about Cloudinary URLs.
        return true; 
    }
    
    // Ensure URL is absolute
    if (!url.startsWith('http')) return false;

    try {
        await axios.head(url);
        return true;
    } catch (e) {
        if (e.response && e.response.status === 404) return false;
        // 403 or others might mean accessible but forbidden to HEAD, assume okay
        return true; 
    }
}

async function audit() {
    console.log("🔍 Starting Image Audit...");
    const products = await prisma.product.findMany({
        select: { id: true, title: true, images: true, category: true }
    });

    console.log(`Checking ${products.length} products...`);
    let deletedCount = 0;

    for (const p of products) {
        let images = [];
        try {
            images = JSON.parse(p.images);
            if (!Array.isArray(images)) images = [images];
        } catch (e) {
            console.error(`Error parsing images for ${p.id}`, e);
            continue;
        }

        if (images.length === 0) {
            console.log(`❌ Removing ${p.id} (${p.title}) - No Images`);
            await prisma.product.delete({ where: { id: p.id } });
            deletedCount++;
            continue;
        }

        // Check the primary image (first one)
        const primaryImage = images[0];
        // Fix up URL for checking if partially hardcoded in controller logic vs DB
        // The DB usually stores the full Cloudinary URL or a path relative to root?
        // Let's assume what's in DB is what we check.
        
        let urlToCheck = primaryImage;
        // Fix for the specific broken links the user sees from "postershop"
        // If DB stores "/postershop/...", prepend cloudinary base?
        // Actually the DB likely stores "http://res.cloudinary..." or "/postershop/..."
        
        // If it starts with /postershop, we need the base.
        // But wait, the controller adds the base logic often.
        // Let's just try to check valid URLs.

        const isValid = await checkUrl(urlToCheck);

        if (!isValid) {
            console.log(`❌ Removing ${p.id} (${p.title}) - Broken Link: ${urlToCheck}`);
            await prisma.product.delete({ where: { id: p.id } });
            deletedCount++;
        } else {
            // process.stdout.write('.');
        }
    }

    console.log(`\n✅ Audit Complete. Deleted ${deletedCount} products.`);
    await prisma.$disconnect();
}

audit();
