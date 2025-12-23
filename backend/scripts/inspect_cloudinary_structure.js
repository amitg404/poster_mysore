const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../.env') });


if (!process.env.CLOUDINARY_URL) {
    console.error("❌ CLOUDINARY_URL is missing from .env");
    process.exit(1);
}
cloudinary.config({ secure: true });


async function listFolders() {
    try {
        console.log("📂 Listing Subfolders in 'postershop'...");
        const result = await cloudinary.api.sub_folders('postershop');
        console.log(JSON.stringify(result.folders, null, 2));
    } catch (e) {
        console.error(e);
    }
}

listFolders();
