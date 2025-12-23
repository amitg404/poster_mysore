const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Ensure Environment Variables
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// Configuration
// Using the manual URL as backup if ENV fails, based on previous script success

// Cloudinary config parses from env automatically if CLOUDINARY_URL is set
if (!process.env.CLOUDINARY_URL) {
    console.error("❌ CLOUDINARY_URL is missing from .env");
    process.exit(1);
}
cloudinary.config({ secure: true });


// Stats
const stats = {
    fetched: 0,
    uniqueCloud: 0,
    dbTotal: 0,
    created: 0,
    updated: 0,
    softDeleted: 0,
    errors: 0
};

// Main Execution
async function main() {
    try {
        console.log("🚀 Starting ADVANCED DB REWRITE Sync...");
        const startTime = Date.now();

        // 1. Fetch Cloudinary Data
        const allResources = await fetchAllCloudinaryResources();
        stats.fetched = allResources.length;
        console.log(`✅ Fetched ${stats.fetched} resources from Cloudinary.`);

        // 2. Process Cloudinary Data into Map
        const cloudMap = new Map(); // Key: Normalized Title
        
        for (const res of allResources) {
            const { title, category, normalizedKey } = parseResource(res);
            // Overwrite duplicates with latest (can add logic to warn)
            cloudMap.set(normalizedKey, {
                title,
                category,
                imageUrl: res.secure_url,
                publicId: res.public_id,
                res
            });
        }
        stats.uniqueCloud = cloudMap.size;
        console.log(`✨ Identified ${stats.uniqueCloud} unique products.`);

        // 3. Fetch Existing DB Data
        const dbProducts = await prisma.product.findMany();
        stats.dbTotal = dbProducts.length;
        console.log(`🗄️  Found ${stats.dbTotal} existing DB products.`);

        // 4. Batch Processing - UPSERT
        // We iterate through CLOUDINARY items to Ensure they exist/update
        const upsertPromises = [];
        const BATCH_SIZE = 50;
        let processed = 0;

        // Convert Map to Array for iteration
        const cloudItems = Array.from(cloudMap.values());
        
        // Helper to find DB match
        const findDbMatch = (normalizedKey) => {
            return dbProducts.find(p => normalizeKey(p.title) === normalizedKey);
        };

        for (let i = 0; i < cloudItems.length; i += BATCH_SIZE) {
            const batch = cloudItems.slice(i, i + BATCH_SIZE);
            
            const batchPromises = batch.map(async (cData) => {
                const normalizedKey = normalizeKey(cData.title);
                const existing = findDbMatch(normalizedKey);

                if (existing) {
                    // Update
                    await prisma.product.update({
                        where: { id: existing.id },
                        data: {
                            title: cData.title, // Enforce canonical title
                            category: cData.category,
                            price: calculatePrice(cData), // Dynamic Price
                            images: JSON.stringify([cData.imageUrl]),
                            isAvailable: true,
                            tags: JSON.stringify([cData.category.toLowerCase()]),
                            // Reset stock if needed?
                            stock: existing.stock < 10 ? 100 : existing.stock
                        }
                    });
                    stats.updated++;
                } else {
                    // Create
                    await prisma.product.create({
                        data: {
                            title: cData.title,
                            description: `Premium ${cData.category} design.`,
                            category: cData.category,
                            price: calculatePrice(cData), // Dynamic Price
                            images: JSON.stringify([cData.imageUrl]),
                            stock: 100,
                            isAvailable: true,
                            tags: JSON.stringify([cData.category.toLowerCase()])
                        }
                    });
                    stats.created++;
                }
            });

            await Promise.all(batchPromises);
            processed += batch.length;
            process.stdout.write(`\r🔄 Processing Upserts: ${processed}/${cloudItems.length}`);
        }
        console.log("\n✅ Upserts Complete.");

        // 5. Soft Delete / Disable Missing
        // Iterate through DB items. If Key is NOT in cloudMap -> disable
        const deletedReport = [];
        const deletePromises = [];
        
        for (const p of dbProducts) {
            const key = normalizeKey(p.title);
            if (!cloudMap.has(key)) {
                if (p.isAvailable) {
                    deletePromises.push(
                        prisma.product.update({
                            where: { id: p.id },
                            data: { isAvailable: false }
                        }).then(() => {
                            stats.softDeleted++;
                            deletedReport.push(`${p.category} | ${p.title} (${p.id})`);
                        })
                    );
                }
            }
        }
        
        await Promise.all(deletePromises);
        console.log(`🗑️  Soft Deleted ${stats.softDeleted} items.`);

        // Write Report
        if (deletedReport.length > 0) {
            fs.writeFileSync('deleted_report.txt', deletedReport.join('\n'));
            console.log("📝 detailed deleted_report.txt created.");
        }

        const duration = (Date.now() - startTime) / 1000;
        console.log(`\n🎉 SYNC COMPLETED in ${duration}s`);
        console.log(stats);

    } catch (error) {
        console.error("❌ Fatal Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// --- Helpers ---

// Normalize string for Key Matching (The "Rewrite" enforcer)
function normalizeKey(str) {
    if (!str) return 'unknown';
    return str.toLowerCase()
        .replace(/poster$/i, '') // Remove trailing 'poster'
        .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric
        .trim();
}

function parseResource(res) {
    // folders: postershop/Category/Filename
    const parts = res.public_id.split('/');
    let folderName = 'Uncategorized';
    if (parts.length >= 2) {
        folderName = parts[parts.length - 2];
    }

    // Explicit Folder Mappings
    if (folderName === 'tv_shows') category = 'TV Shows';
    else if (folderName === 'Japanese_ART') category = 'Japanese Art';
    else if (res.public_id.toLowerCase().includes('/bundles/') || folderName.toLowerCase().includes('bundle')) category = 'Bundles';
    else category = folderName.replace(/_/g, ' ');
    
    // Capitalize Category if not manually set above
    if (!['TV Shows', 'Japanese Art', 'Bundles'].includes(category)) {
         category = category.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Title from Filename
    const filename = parts[parts.length - 1];
    let title = formatTitle(filename);

    return {
        title,
        category,
        normalizedKey: normalizeKey(title)
    };
}

function calculatePrice(cData) {
    // 1. Standard Poster = 99
    if (cData.category !== 'Bundles') return 99;

    // 2. Bundles: Try to find price in title/folder
    // Pattern: "6 Pack 499" or "Buy 4 at 249"
    // Regex looking for numbers at end or after 'at'
    
    const title = cData.title;
    
    // Match "499" at end of string
    const priceMatch = title.match(/(\d{3,4})$/);
    if (priceMatch) return parseInt(priceMatch[1]);
    
    // Match "At 249"
    const atMatch = title.match(/At (\d{3,4})/i);
    if (atMatch) return parseInt(atMatch[1]);

    return 399; // Fallback for Bundles
}

function formatTitle(filename) {
    let clean = filename;
    // Remove "Category-" prefix if exists
    if (clean.includes('-')) {
        const parts = clean.split('-');
        if (parts.length > 1) clean = parts.slice(1).join(' ');
    }
    // Remove underscores
    clean = clean.replace(/_/g, ' ');
    // Remove trailing "poster"
    clean = clean.replace(/ poster$/i, '');
    
    // Title Case
    return clean.split(' ')
        .filter(w => w.length > 0)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .trim();
}

async function fetchAllCloudinaryResources() {
    let all = [];
    let nextCursor = null;
    do {
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'postershop/',
            max_results: 500,
            next_cursor: nextCursor,
            context: true
        });
        all = [...all, ...result.resources];
        nextCursor = result.next_cursor;
        process.stdout.write(`\r📦 Fetching Cloudinary: ${all.length} items...`);
    } while (nextCursor);
    console.log("");
    return all;
}

main();
