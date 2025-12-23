require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');

const envPathBackend = path.join(process.cwd(), 'backend', '.env');
const envPathRoot = path.join(process.cwd(), '.env');

if (fs.existsSync(envPathBackend)) {
    require('dotenv').config({ path: envPathBackend });
} else if (fs.existsSync(envPathRoot)) {
    require('dotenv').config({ path: envPathRoot });
} else {
    require('dotenv').config();
}

const cloudinary = require('cloudinary').v2;

async function listFolders() {
    console.log("📂 Listing sub-folders of 'poster_mysore_products'...");
    
    // Check config
    if (!process.env.CLOUDINARY_URL) {
        console.error("❌ CLOUDINARY_URL missing.");
        process.exit(1);
    }

    try {
        const result = await cloudinary.api.sub_folders('poster_mysore_products');
        console.log("Found folders:");
        result.folders.forEach(f => console.log(` - ${f.name} (path: ${f.path})`));
    } catch (e) {
        console.error("❌ Failed to list folders:", e.message);
        // Fallback: list root folders if parent doesn't exist
        try {
            console.log("Trying root folders...");
            const root = await cloudinary.api.root_folders();
            root.folders.forEach(f => console.log(` [Root] - ${f.name}`));
        } catch (err) {
            console.error("❌ Failed to list root folders:", err.message);
        }
    }
}

listFolders();
