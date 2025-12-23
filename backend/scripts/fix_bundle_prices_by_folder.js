const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🛠️  Fixing Bundle Prices & URLs from Folder Name...");

        const bundles = await prisma.product.findMany({
            where: { category: 'Bundles' }
        });

        console.log(`🔍 Processing ${bundles.length} bundle items...`);

        for (const b of bundles) {
            let images = [];
            try {
                images = JSON.parse(b.images);
            } catch { continue; }
            
            if (!images || images.length === 0) continue;
            
            const url = images[0];
            // Expected: .../postershop/Some_Bundle_999/image.jpg
            
            // 1. Extract Folder and Price
            let price = b.price;
            let folderMatch = url.match(/\/([^\/]+)_(\d+)Rs\//i) || url.match(/\/([^\/]+)_(\d+)\//);        
            
            // Try simpler: look for any segment with numbers + Rs
            if (!folderMatch) {
               const segments = url.split('/');
               for (const seg of segments) {
                   const m = seg.match(/(\d+)Rs/i);
                   if (m) {
                       price = parseInt(m[1]);
                       break;
                   }
                   // Or just number at end of segment?
                   const m2 = seg.match(/_(\d+)$/);
                   if (m2) {
                       price = parseInt(m2[1]);
                   }
               }
            } else {
                price = parseInt(folderMatch[2]);
            }

            // 2. Fix URL if needed (User reported 404s)
            // If URL is missing 'postershop' prefix before the category folder?
            // Current Sync script puts 'postershop' if found in public_id.
            // Let's assume the DB URL is "https://res.cloudinary.com/.../postershop/Folder/file.jpg"
            // If it's 404, maybe it should be "v<version>"? Sync script usually handles this.
            
            // Let's just log the changes for now and apply the PRICE update.
            // And if the URL contains 'posters_799Rs' but NOT 'postershop', maybe inject it?
            
            let newUrl = url;
            if (!url.includes('postershop') && url.includes('cloudinary')) {
                // Heuristic: Inject postershop after 'upload/' or version
                 newUrl = url.replace(/\/upload\/(v\d+\/)?/, (match) => `${match}postershop/`);
            }

            let dataToUpdate = {};
            if (price !== b.price && price > 0) { // Only update if valid price found
                console.log(`   - Price Update: "${b.title}" (Folder) -> ₹${price}`);
                dataToUpdate.price = price;
            }
            if (newUrl !== url) {
                console.log(`   - URL Fix: ${url} -> ${newUrl}`);
                dataToUpdate.images = JSON.stringify([newUrl]);
            }
            
            if (Object.keys(dataToUpdate).length > 0) {
                 await prisma.product.update({
                    where: { id: b.id },
                    data: dataToUpdate
                });
            }
        }
        
        console.log("✅ Bundle Fixes Complete.");

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
