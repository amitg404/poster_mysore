const cloudinary = require('cloudinary').v2;

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (!process.env.CLOUDINARY_URL) {
    console.error("❌ CLOUDINARY_URL is missing from .env");
    process.exit(1);
}

cloudinary.config({ secure: true });

async function main() {
    try {
        const root = 'postershop/bundles';
        console.log(`📂 Inspecting Cloudinary Folder: ${root}\n`);

        // 1. Get Sub-folders
        try {
            const folders = await cloudinary.api.sub_folders(root);
            if (folders.folders.length > 0) {
                console.log(`📁 Sub-folders found (${folders.folders.length}):`);
                for (const f of folders.folders) {
                    console.log(`   - ${f.path}`);
                    await listImagesInFolder(f.path);
                }
            } else {
                console.log("ℹ️ No sub-folders found.");
            }
        } catch (e) {
             if (e.error && e.error.message.includes('No folders found')) {
                 console.log("ℹ️ No sub-folders found.");
             } else {
                 console.error("❌ Folder Error:", e.message);
             }
        }

        // 2. Get Images in Root of Bundles
        await listImagesInFolder(root);

    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

async function listImagesInFolder(folder) {
    console.log(`\n🖼️  Files in '${folder}':`);
    try {
        const result = await cloudinary.search
            .expression(`folder:"${folder}" AND resource_type:image`)
            .sort_by('public_id', 'asc')
            .max_results(500)
            .execute();
        
        if (result.resources.length === 0) {
            console.log("   (Empty)");
        } else {
            result.resources.forEach(r => {
                console.log(`   📄 ${r.public_id}.${r.format}`);
            });
        }
    } catch (e) {
        console.error(`   ❌ Failed to list files: ${e.message}`);
    }
}

main();
