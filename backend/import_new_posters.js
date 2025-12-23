require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();

// Configuration
const IMAGES_DIR = path.join(__dirname, '../pinterest_scraper/downloaded_images');
const CLOUDINARY_FOLDER = "poster_mysore_new";

async function uploadToCloudinary(filePath) {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: CLOUDINARY_FOLDER,
            use_filename: true,
            unique_filename: false,
        });
        return result.secure_url;
    } catch (error) {
        console.error(`❌ Upload Failed: ${path.basename(filePath)} - ${error.message}`);
        return null;
    }
}

async function main() {
    console.log("🚀 Starting Huge Import Process...");

    // 1. Clear Database
    console.log("🗑️  Clearing existing products...");
    await prisma.cartItem.deleteMany({}); // Clear cart first due to foreign key
    await prisma.orderItem.deleteMany({}); // Clear order items if any
    await prisma.product.deleteMany({});
    console.log("✅ Database cleared.");

    if (!fs.existsSync(IMAGES_DIR)) {
        console.error(`❌ Source directory not found: ${IMAGES_DIR}`);
        return;
    }

    const categories = fs.readdirSync(IMAGES_DIR).filter(item => {
        return fs.statSync(path.join(IMAGES_DIR, item)).isDirectory();
    });

    for (const category of categories) {
        const categoryPath = path.join(IMAGES_DIR, category);
        
        // --- Special Handling for Bundles ---
        if (category.toLowerCase() === 'bundles') {
            console.log(`📦 Processing Bundles...`);
            const bundles = fs.readdirSync(categoryPath).filter(item => fs.statSync(path.join(categoryPath, item)).isDirectory());
            
            for (const bundleFolder of bundles) {
                // Expected format: Name_Cost (e.g., AnimeMix_299)
                const parts = bundleFolder.split('_');
                const price = parts.length > 1 ? parseInt(parts[parts.length - 1]) : 299; // Default 299 if parse fails
                const title = parts.slice(0, parts.length - 1).join(' ') || bundleFolder; // Join rest as title
                
                const bundlePath = path.join(categoryPath, bundleFolder);
                const files = fs.readdirSync(bundlePath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
                
                if (files.length === 0) continue;

                console.log(`   Processing Bundle: ${title} (₹${price}) with ${files.length} images...`);
                
                const imageUrls = [];
                for (const file of files) {
                    const url = await uploadToCloudinary(path.join(bundlePath, file));
                    if (url) imageUrls.push(url);
                }

                if (imageUrls.length > 0) {
                    await prisma.product.create({
                        data: {
                            title: title,
                            description: `${title} Bundle - Contains ${files.length} Premium Posters`,
                            price: price,
                            category: 'Bundles',
                            tags: JSON.stringify(['Bundle', title]),
                            images: JSON.stringify(imageUrls),
                            isAvailable: true
                        }
                    });
                }
            }
            continue;
        }

        // --- Standard Categories ---
        console.log(`📂 Processing Category: ${category}...`);
        const files = fs.readdirSync(categoryPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
        
        for (const file of files) {
            // For normal posters, one image = one product
            console.log(`   Uploading: ${file}...`);
            const url = await uploadToCloudinary(path.join(categoryPath, file));
            
            if (url) {
                // Create a title from filename (e.g., "naruto_poster_1.jpg" -> "Naruto Poster 1")
                const title = path.parse(file).name
                    .replace(/[_-]/g, ' ')
                    .replace(/\d+$/, '') // Remove trailing numbers
                    .trim();

                await prisma.product.create({
                    data: {
                        title: title || `${category} Poster`,
                        description: `Premium ${category} A3 Poster`,
                        price: 99, // Default Price
                        category: category, // Folder name is category
                        tags: JSON.stringify([category]),
                        images: JSON.stringify([url]),
                        isAvailable: true
                    }
                });
            }
        }
    }

    console.log("🎉 All Imports Finished!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
