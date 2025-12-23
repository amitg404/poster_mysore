require('dotenv').config({ path: '../.env' }); // Adjust path to reach root .env if needed, or assume running from backend root
const fs = require('fs');
const path = require('path');

const envPathBackend = path.join(process.cwd(), 'backend', '.env');
const envPathRoot = path.join(process.cwd(), '.env');

console.log(`Current CWD: ${process.cwd()}`);

if (fs.existsSync(envPathBackend)) {
    console.log(`Loading .env from: ${envPathBackend}`);
    require('dotenv').config({ path: envPathBackend });
} else if (fs.existsSync(envPathRoot)) {
     console.log(`Loading .env from: ${envPathRoot}`);
    require('dotenv').config({ path: envPathRoot });
} else {
    console.log("No specific .env file found, using default dotenv lookup.");
    require('dotenv').config();
}

const cloudinary = require('cloudinary').v2;

async function cleanupCategories() {
    console.log("🔍 Starting Cloudinary Cleanup Dry Run...");

    // 1. Verify Config
    const cloudUrl = process.env.CLOUDINARY_URL;
    if (!cloudUrl || cloudUrl.includes('<your_api_key>')) {
        console.error(`❌ CLOUDINARY_URL missing or invalid. Found: ${cloudUrl ? 'Yes (Masked)' : 'No'}`);
        process.exit(1);
    } else {
        console.log("ℹ️  CLOUDINARY_URL appears set.");
    }

    try {
        await cloudinary.api.ping();
        console.log("✅ Cloudinary Connected");
    } catch (e) {
        console.error("❌ Connection failed. Full Error:", e);
        process.exit(1);
    }

    console.log("🕵️‍♀️ DEEP SEARCH MODE: Listing up to 500 resources in 'poster_mysore_products' to find matches...");

    try {
        let nextCursor = null;
        const results = [];
        do {
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'poster_mysore_products', 
                max_results: 500,
                next_cursor: nextCursor
            });
            
            for (const res of result.resources) {
                // Check if ID contains our targets
                const pid = res.public_id;
                if (pid.match(/Abstact/i) || pid.match(/\/car[\/_]/i) || pid.match(/\/car$/i)) {
                     console.log(`🎯 FOUND POTENTIAL MATCH: ${pid}`);
                }
            }
            if (result.next_cursor) nextCursor = result.next_cursor;
            else nextCursor = null;
            
            // Just one page for now to save time/api calls, unless we really need deep crawl
            break; 
        } while (nextCursor);

    } catch (e) {
        console.error("❌ Error listing resources:", e.message);
    }
}

cleanupCategories();
