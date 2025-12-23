const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');
const path = require('path');
// Assume running from backend/ so .env is in current dir
require('dotenv').config(); 
// Also try parent just in case
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// Debugging Env loading
// Explicitly using the URL provided by the user to unblock the task

if (!process.env.CLOUDINARY_URL) {
    console.error("❌ CLOUDINARY_URL is missing from .env");
    process.exit(1);
}

cloudinary.config({
    secure: true
});



async function main() {
  try {
    console.log("🚀 Starting LIVE DB Sync with Cloudinary...");
    console.log("   - Fetching all resources from 'postershop' folder");
    console.log("   - Updating/Creating products based on filename/folder");
    console.log("   - Soft deleting products missing from Cloudinary");

    // 1. Fetch Loop (Handle Pagination)
    let allResources = [];
    let nextCursor = null;
    let page = 1;

    do {
      // Using Admin API 'resources' as it's often more reliable/available than Search API on some tiers
      // Fetching by prefix 'postershop/'
      // Note: 'max_results' is up to 500
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'postershop/', // Adjust if your root folder is different
        max_results: 500,
        next_cursor: nextCursor,
        context: true // Fetch context/metadata if available
      });

      allResources = [...allResources, ...result.resources];
      nextCursor = result.next_cursor;
      console.log(`   📦 Page ${page} fetched. Count: ${result.resources.length}. Total so far: ${allResources.length}`);
      page++;
    } while (nextCursor);

    console.log(`✅ Fetched total ${allResources.length} images from Cloudinary.`);

    // 2. Prepare Cloudinary Map
    // Map Key: Title (normalized), Value: Product Data
    const cloudProductMap = new Map();

    for (const res of allResources) {
      // Structure: res.public_id = "postershop/tv_shows/stranger_things_v1"
      // res.folder = "postershop/tv_shows"
      
      // Determine Folder/Category
      let folderName = "Uncategorized";
      const parts = res.public_id.split('/');
      
      // If public_id is "postershop/tv_shows/filename", parts length is 3.
      if (parts.length >= 2) {
          folderName = parts[parts.length - 2];
      }
      
      // Special Handling for Bundles Folder
      let category = formatCategory(folderName);
      if (folderName.toLowerCase().includes('bundle')) {
          category = "Bundles";
      }
      
      // Determine Title
      // parts[parts.length - 1] is the filename (without extension usually in public_id)
      const rawFilename = parts[parts.length - 1];
      const title = formatTitle(rawFilename);

      // Store in Map
      // Note: If duplicates exist (same title, different folders), last one wins.
      cloudProductMap.set(title, {
          title,
          category,
          imageUrl: res.secure_url,
          publicId: res.public_id
      });
    }

    console.log(`✨ Identified ${cloudProductMap.size} unique products from Cloudinary.`);

    // 3. Sync with DB
    const dbProducts = await prisma.product.findMany();
    console.log(`🗄️  Found ${dbProducts.length} products in current Database.`);
    
    // Create a lookup for existing DB products to avoid O(N^2)
    const dbTitleMap = new Map();
    dbProducts.forEach(p => dbTitleMap.set(p.title, p));

    let created = 0;
    let updated = 0;
    let softDeleted = 0;

    // A. Upsert (Create or Update)
    for (const [title, cData] of cloudProductMap) {
        const existing = dbTitleMap.get(title);

        if (existing) {
            // Check if update is needed (category changed, url changed, or was unavailable)
            // We'll update regardless to ensure consistency
            await prisma.product.update({
                where: { id: existing.id },
                data: {
                    category: cData.category,
                    price: 99, // Force Price Update to 99
                    images: JSON.stringify([cData.imageUrl]), // Overwrite with new URL
                    isAvailable: true,
                    tags: JSON.stringify([cData.category.toLowerCase()])
                }
            });
            updated++;
        } else {
            // Create New
            await prisma.product.create({
                data: {
                    title: title,
                    description: `Premium ${cData.category} poster.`,
                    category: cData.category,
                    price: 99, // New Standard Price
                    images: JSON.stringify([cData.imageUrl]),
                    stock: 100,
                    isAvailable: true,
                    tags: JSON.stringify([cData.category.toLowerCase()])
                }
            });
            created++;
        }
    }

    // B. Soft Delete (Items in DB not in Cloudinary)
    for (const p of dbProducts) {
        if (!cloudProductMap.has(p.title)) {
            // Only soft delete if currently available (to avoid redundant log)
            if (p.isAvailable) {
                await prisma.product.update({
                    where: { id: p.id },
                    data: { isAvailable: false }
                });
                softDeleted++;
                // console.log(`   🗑️  Soft Deleted: ${p.title}`);
            }
        }
    }

    console.log("=========================================");
    console.log(`✅ SYNC COMPLETE`);
    console.log(`   Created New: ${created}`);
    console.log(`   Updated Existing: ${updated}`);
    console.log(`   Soft Deleted: ${softDeleted}`);
    console.log("=========================================");

  } catch (error) {
    console.error("❌ Sync Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helpers

function formatCategory(folderName) {
    // raw: "tv_shows" -> "TV Shows"
    // raw: "Geometric_art" -> "Geometric Art"
    // raw: "anime" -> "Anime"
    
    // Handle specific overrides if needed, otherwise generic logic
    return folderName
        .replace(/_/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function formatTitle(filename) {
    // filename: "Anime-One_Piece_Luffy" -> "One Piece Luffy"
    // filename: "stranger_things_poster" -> "Stranger Things Poster"
    
    let clean = filename;
    
    // 1. Remove category prefix if present (heuristic: "Word-Word" where Word matches category)
    // Actually, simple heuristic: if it has a hyphen, take the last part? 
    // Or if first part is same as known category?
    // User mentioned: "Anime-One_Piece..."
    
    if (clean.includes('-')) {
        const parts = clean.split('-');
        // If we have >1 part, assume first part is category prefix and drop it
        if (parts.length > 1) {
             clean = parts.slice(1).join(' ');
        }
    }
    
    // 2. Replace underscores with spaces
    clean = clean.replace(/_/g, ' ');
    
    // 3. Remove "Poster" if it's at the end (optional cleanup)
    clean = clean.replace(/ poster$/i, '');

    // 4. Title Case
    return clean
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .trim();
}

main();
