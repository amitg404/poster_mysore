const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function main() {
    try {
        console.log("🔍 Listing Root Folders in 'postershop'...");
        const rootFolders = await cloudinary.api.sub_folders('postershop');
        console.log("FOLDERS:", rootFolders.folders.map(f => f.name).join(', '));

        console.log("\n🔍 Checking 'postershop/music' content...");
        const musicImages = await cloudinary.search
            .expression('folder:postershop/music/* AND resource_type:image')
            .max_results(5)
            .execute();
        
        musicImages.resources.forEach(img => {
            console.log(` - ${img.public_id} (${img.format}) -> ${img.secure_url}`);
        });

    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

main();
