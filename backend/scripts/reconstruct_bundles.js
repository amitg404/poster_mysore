const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUNDLE_DEFINITIONS = [
    {
        key: 'Luffy',
        title: 'Luffy Crew Wanted Posters',
        price: 799,
        matcher: (t) => {
            const lower = t.toLowerCase();
            return lower.includes('luffy') || lower.includes('zoro') || lower.includes('nami') || lower.includes('sanji') || lower.includes('chopper') || lower.includes('robin') || lower.includes('franky') || lower.includes('brook') || lower.includes('jinbe') || lower.includes('usopp');
        },
        targetCount: 10
    },
    {
        key: 'Avengers',
        title: 'Avengers Bundle',
        price: 479,
        matcher: (t) => t.toLowerCase().includes('avengers'),
        targetCount: 6
    },
    {
        key: 'F1',
        title: 'F1 Bundle',
        price: 479,
        matcher: (t) => t.toLowerCase().includes('f1') || t.toLowerCase().includes('formula 1') || t.toLowerCase().includes('mercedes') || t.toLowerCase().includes('redbull') || t.toLowerCase().includes('ferrari') || t.toLowerCase().includes('mclaren'),
        targetCount: 6
    },
    {
        key: 'Supercars',
        title: 'Supercars',
        price: 799,
        matcher: (t) => {
            const lower = t.toLowerCase();
            return lower.includes('supercar') || lower.includes('lambo') || lower.includes('ferrari') || lower.includes('porsche') || lower.includes('koenisegg') || lower.includes('bugatti') || lower.includes('mclaren') || lower.includes('audi') || lower.includes('bmw') || lower.includes('mercedes');
        },
        targetCount: 10
    },
    {
        key: 'GTR',
        title: 'GTRS3',
        price: 199,
        matcher: (t) => t.toLowerCase().includes('gtrs') || t.toLowerCase().includes('gt-r'),
        sort: (a, b) => {
            const getNum = (str) => {
                const m = str.match(/gtrs(\d+)/i);
                return m ? parseInt(m[1]) : 99;
            };
            return getNum(a.title) - getNum(b.title);
        },
        targetCount: 3
    }
];

async function main() {
    try {
        console.log("🛠️  Reconstructing Bundles (Strict Mode)...");

        // 1. Fetch All Products (Search entire catalogue to find variants)
        // We need to be careful not to consume the Bundles we just created in the previous run.
        // We should exclude the Aggregate Bundles by title if possible, or filter them out.
        const allProducts = await prisma.product.findMany({});
        
        console.log(`Found ${allProducts.length} total products to scan.`);

        // 2. Group Items
        const groups = {};
        const usedIds = new Set();
        
        // Pre-identify existing aggregates to exclude them from being "consumed" as ingredients
        const aggregateTitles = BUNDLE_DEFINITIONS.map(d => d.title);

        for (const def of BUNDLE_DEFINITIONS) {
            groups[def.key] = [];
            
            for (const item of allProducts) {
                if (usedIds.has(item.id)) continue;
                if (aggregateTitles.includes(item.title)) continue; // Don't eat the bundles themselves

                if (def.matcher(item.title)) {
                    groups[def.key].push(item);
                    // Don't mark used yet, maybe an item belongs to multiple? 
                    // Ideally exclusive. Let's mark used.
                    usedIds.add(item.id);
                }
            }
        }

        // 3. Process Each Group
        for (const def of BUNDLE_DEFINITIONS) {
            const items = groups[def.key];
            console.log(`\n📦 Processing ${def.title} (${items.length} candidates found)`);
            
            // Custom sort
            if (def.sort) {
                items.sort(def.sort);
            }
            
            // Collect Images (Flatten)
            let allImages = [];
            for (const item of items) {
                try {
                    const imgs = JSON.parse(item.images);
                    if (Array.isArray(imgs)) allImages.push(...imgs);
                    else if (imgs) allImages.push(imgs);
                } catch { }
            }
            
            // STRICT SPLICING
            if (allImages.length > def.targetCount) {
                console.log(`   ✂️  Trimming images from ${allImages.length} to ${def.targetCount}`);
                allImages = allImages.slice(0, def.targetCount);
            } else if (allImages.length < def.targetCount) {
                console.log(`   ⚠️  Warning: Found only ${allImages.length} images. Target is ${def.targetCount}.`);
            }
            
            if (allImages.length === 0) continue;

            // Update/Create Aggregate Product
            const existing = await prisma.product.findFirst({
                where: { title: def.title, category: 'Bundles' }
            });

            const data = {
                title: def.title,
                description: `${def.title} - Contains ${allImages.length} Premium Posters.`,
                category: 'Bundles',
                price: def.price,
                images: JSON.stringify(allImages),
                stock: 100,
                isAvailable: true,
                tags: JSON.stringify(['bundles', def.key.toLowerCase()])
            };

            if (existing) {
                 console.log(`   - Updating existing bundle...`);
                 await prisma.product.update({ where: { id: existing.id }, data });
            } else {
                console.log(`   - Creating NEW bundle...`);
                await prisma.product.create({ data });
            }
        }

        // 4. Cleanup ONLY the broken fragments in 'Bundles'
        // We do NOT want to delete items from 'Cars' or 'F1' categories that were used to build the bundle.
        // ONLY delete items in 'Bundles' category that are NOT the Aggregate Bundle Titles.
        
        const toDelete = await prisma.product.deleteMany({
            where: {
                category: 'Bundles',
                title: { notIn: aggregateTitles }
            }
        });
        
        console.log(`\n🗑️  Cleaned up ${toDelete.count} fragment items from 'Bundles' category.`);
        console.log("✅ Strict Bundle Reconstruction Complete.");

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
