const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
// We'll try to find the audit file.
const AUDIT_FILE = path.join(__dirname, 'cloudinary_audit.json');

async function syncCloudinary() {
    try {
        console.log("🚀 Starting DB Sync with Cloudinary Audit...");
        
        if (!fs.existsSync(AUDIT_FILE)) {
            console.error(`❌ Audit file not found: ${AUDIT_FILE}`);
            console.log("   Please run a script to generate the audit file first, or ensure it exists.");
            return;
        }

        const auditData = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
        console.log(`📂 Loaded ${auditData.length} items from audit file.`);

        // 1. Fetch all existing products from DB
        const dbProducts = await prisma.product.findMany();
        console.log(`🗄️  Found ${dbProducts.length} products in Database.`);

        const dbMap = new Map();
        dbProducts.forEach(p => dbMap.set(p.title, p));

        let addedCount = 0;
        let updatedCount = 0;

        // 2. Iterate through Cloudinary items and Update/Create in DB
        for (const item of auditData) {
            // item structure expected: { public_id, url, folder, ... }
            // Extract title and category from folder/public_id
            // public_id might be "postershop/anime/Anime-One_Piece_Luffy"
            
            const parts = item.public_id.split('/');
            const filename = parts[parts.length - 1]; // Anime-One_Piece_Luffy
            
            // Heuristic to get Title and Category
            // Assuming filename format: Category-Title_Of_Poster
            let category = "Uncategorized";
            let title = filename;

            if (filename.includes('-')) {
                const splitName = filename.split('-');
                category = splitName[0].trim(); // e.g., Anime
                title = splitName.slice(1).join(' ').replace(/_/g, ' ').trim(); // One Piece Luffy
            } else {
                // Fallback: use folder name as category
                if (parts.length > 2) {
                   category = parts[parts.length - 2]; 
                }
                title = filename.replace(/_/g, ' ');
            }
            
            // Normalize Category Strings for Consistency if needed
            // (The controller handles the mapping for URLs, but good to have clean DB data)

            const existingProduct = dbMap.get(title);

            if (existingProduct) {
                // Update Image URL if different
                // ensuring we use the NEW url format if possible
                // We'll store the direct Cloudinary URL or the one from audit
                
                // For now, let's just ensure the product exists. 
                // Updating EVERY image URL might be heavy, but if the URL in DB is broken...
                
                // Check if images is valid JSON
                let currentImages = [];
                try {
                     currentImages = JSON.parse(existingProduct.images);
                } catch(e) { currentImages = []; }

                // If current images are empty or using old path, update
                if (currentImages.length === 0 || !JSON.stringify(currentImages).includes(item.url)) {
                     // Update logic if needed specifically for broken links
                }

            } else {
                // Create New Product
                // console.log(`✨ Creating: [${category}] ${title}`);
                
                await prisma.product.create({
                    data: {
                        title: title,
                        description: `Premium ${category} poster.`,
                        price: 399, // Default price
                        images: JSON.stringify([item.url]),
                        category: category, 
                        tags: JSON.stringify([category.toLowerCase()]),
                        stock: 100,
                        isAvailable: true
                    }
                });
                addedCount++;
            }
        }
        
        console.log(`✅ Sync Complete.`);
        console.log(`   Added: ${addedCount}`);
        
        // 3. Optional: Identify Deleted items?
        // This is risky without a 100% complete audit file. 
        // If the audit file is partial, we might delete valid products.
        // Skipping delete for now unless explicitly requested with a full audit.

    } catch (error) {
        console.error("❌ Sync Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

syncCloudinary();
