require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function main() {
    console.log("🚀 Starting Bulk Import & Migration...");

    // Check Cloudinary
    if (!process.env.CLOUDINARY_URL || process.env.CLOUDINARY_URL.includes('<your_api_key>')) {
        console.error("❌ CLOUDINARY_URL missing or invalid.");
        process.exit(1);
    }

    // Cloudinary Free Tier often has a 500 request/hour limit.
    // We limit to 400 per run to be safe.
    const BATCH_LIMIT = 400; 

    // Separate Files and Directories
    const allItems = fs.readdirSync(UPLOADS_DIR);
    console.log(`📂 Found ${allItems.length} items in uploads.`);

    // Sort: Processing Bundles (Directories) FIRST is much better for UX
    const folders = [];
    const files = [];

    for (const item of allItems) {
        const fullPath = path.join(UPLOADS_DIR, item);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) folders.push(item);
        else files.push(item);
    }

    // Process Folders First
    let count = 0;
    
    console.log(`\n📦 Processing ${folders.length} Bundle Folders...`);
    for (const item of folders) {
         if (count >= BATCH_LIMIT) break;
         const fullPath = path.join(UPLOADS_DIR, item);

         // Folder Name Format: "One_piece_gang_799rs"
         console.log(`\n📦 Processing Bundle: ${item}`);
            
         // Parse Folder Name
         const priceMatch = item.match(/_(\d+)(rs|Rs|RS)$/);
         let price = 499; // Default fallback
         let titleRaw = item;

         if (priceMatch) {
             price = parseInt(priceMatch[1]);
             titleRaw = item.replace(priceMatch[0], ''); // Remove _799rs
         }

         const title = titleRaw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
         // ... (Bundle Upload Logic - kept same, simplified for brevity in thought, but must retain strictly)
         
         const bundleImages = fs.readdirSync(fullPath).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
         if (bundleImages.length === 0) continue;

         const cloudUrls = [];
         process.stdout.write('   Uploading images: ');
         for (const img of bundleImages) {
             try {
                 const imgPath = path.join(fullPath, img);
                 const result = await cloudinary.uploader.upload(imgPath, {
                     folder: `poster_mysore_products/Bundles/${title}`,
                     use_filename: true,
                     unique_filename: false,
                 });
                 cloudUrls.push(result.secure_url);
                 process.stdout.write('.');
             } catch (e) {
                 // console.error(`Failed to upload bundle image ${img}:`, e.message);
                 process.stdout.write('x');
             }
         }
         console.log(' Done.');

         if (cloudUrls.length === 0) continue;

         const existing = await prisma.product.findFirst({
             where: { title: title, category: 'Bundles' }
         });

         if (existing) {
             console.log(`   -> Updating DB: ${title}`);
             await prisma.product.update({
                 where: { id: existing.id },
                 data: { images: JSON.stringify(cloudUrls), price: price }
             });
         } else {
             console.log(`   -> Creating DB: ${title} @ ₹${price}`);
             await prisma.product.create({
                 data: {
                     title: title,
                     description: `Exclusive ${title} Bundle. Includes ${cloudUrls.length} premium posters.`,
                     price: price,
                     category: 'Bundles',
                     images: JSON.stringify(cloudUrls),
                     tags: JSON.stringify(['bundles', 'set', title.toLowerCase()]),
                     stock: 20
                 }
             });
         }
         count++;
    }

    // Process Single Files
    console.log(`\n🖼️  Processing Single Images (Skipping existing)...`);
    const validImages = files.filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));

    for (const file of validImages) {
        if (count >= BATCH_LIMIT) break;

        // ... Name Parsing ...
        const parts = file.split('-');
        let category = 'Uncategorized';
        let titleRaw = file.replace(/\.(jpg|jpeg|png|webp)$/i, '');

        if (parts.length >= 2) {
             category = parts[0].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
             titleRaw = parts.slice(1).join('-');
        }
        const title = titleRaw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        // Check Existence
        const existing = await prisma.product.findFirst({
            where: { title: title, category: category }
        });

        if (existing) {
             // SKIP EXISTING SINGLE POSTERS TO SAVE TIME/API
             // process.stdout.write('s');
             continue;
        }

        console.log(`\n➕ Creating new: ${title}`);
        
        // Upload & Create (Only IF NOT EXISTS)
        const subPath = path.join(UPLOADS_DIR, file);
        try {
            const result = await cloudinary.uploader.upload(subPath, {
                folder: `poster_mysore_products/${category}`,
                use_filename: true,
                unique_filename: false,
            });
            
            await prisma.product.create({
                data: {
                    title: title,
                    description: `Premium ${category} Poster. High-quality print on matte paper.`,
                    price: 99,
                    category: category,
                    images: JSON.stringify([result.secure_url]),
                    tags: JSON.stringify([category.toLowerCase(), "featured"]),
                    stock: 50
                }
            });
            process.stdout.write('✅');
            count++;
        } catch (err) {
            console.error(`\n❌ Failed: ${file} - ${err.message}`);
        }
    }

    console.log(`\n🎉 Bulk Import Complete! Processed ${count} images.`);
}

main()
  .catch(e => {
      console.error(e);
      process.exit(1);
  })
  .finally(async () => {
      await prisma.$disconnect();
  });
