const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Explicit path

console.log("Checking Config:");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing");
console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing");
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Missing");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function main() {
    try {
        console.log("\n🔍 Testing Search API...");
        const result = await cloudinary.search
            .expression('folder:postershop/bundles/*')
            .max_results(10)
            .execute();
        
        console.log("✅ Connection Successful");
        console.log(`Found ${result.total_count} resources.`);
        result.resources.forEach(r => {
             console.log(` - ${r.public_id} [${r.folder}]`);
        });

    } catch (e) {
        console.error("❌ Cloudinary Error Full Object:", JSON.stringify(e, null, 2));
        console.error("❌ Cloudinary Error Message:", e.message);
    }
}

main();
