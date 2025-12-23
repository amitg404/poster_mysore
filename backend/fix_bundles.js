require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();

// Configuration
const IMAGES_DIR = path.join(__dirname, '../pinterest_scraper/downloaded_images');
const CLOUDINARY_FOLDER = "poster_mysore_new";

async function uploadToCloudinary(filePath, fileName) {
    try {
        // Upload with specific public_id to avoid duplicates if possible, 
        // or just let Cloudinary handle it. 
        // For speed, let's allow duplicates but we can assume if this script runs, we want to fix bundles.
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

async function fixBundles() {
    console.log("📦 Starting Bundle Fix...");

    const bundlesPath = path.join(IMAGES_DIR, 'bundles');
    if (!fs.existsSync(bundlesPath)) {
        console.error(`❌ Bundles directory not found: ${bundlesPath}`);
        return;
    }

    const bundles = fs.readdirSync(bundlesPath).filter(item => fs.statSync(path.join(bundlesPath, item)).isDirectory());
    
const SIZE_GUIDE_PATH = path.join(__dirname, '../frontend/public/mockups/size-guide.png');

    for (const bundleFolder of bundles) {
        // Handle formats: "Avengers_479rs", "F1_teams_479", "Luffy_Gang_wanted_posters_799Rs"
        // Regex to extract name and price (ignoring 'rs' or 'Rs' suffix)
        // Split by '_'
        const parts = bundleFolder.split('_');
        
        let price = 299; // Default
        let titleParts = [];

        // Walk backwards to find the price part
        for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i];
            // Try to match numbers, optionally followed by rs/Rs
            const match = part.match(/^(\d+)(?:rs|Rs)?/i);
            if (match) {
                price = parseInt(match[1]);
                titleParts = parts.slice(0, i);
                break;
            }
        }
        
        // If no price found, assume last part is price
        if (titleParts.length === 0) {
            titleParts = parts.slice(0, parts.length - 1);
        }

        const title = titleParts.join(' ') || bundleFolder;
        
        console.log(`Processing Bundle: "${title}" @ ₹${price} (Folder: ${bundleFolder})`);

        // Check if bundle already exists to avoid duplicate logic if we run this multiple times
        // actually, simpler to delete old bundle with this title and recreate
        await prisma.product.deleteMany({
            where: { 
                title: title,
                category: 'Bundles' 
            }
        });

        const bundlePath = path.join(bundlesPath, bundleFolder);
        const files = fs.readdirSync(bundlePath).filter(f => {
             const lower = f.toLowerCase();
             return /\.(jpg|jpeg|png|webp)$/i.test(f) && 
                    !lower.includes('mockup') && 
                    !lower.includes('room') && 
                    !lower.includes('setup') &&
                    !lower.includes('desk');
        });
        
        if (files.length === 0) {
            console.log(`   ⚠️ No images found in ${bundleFolder}`);
            continue;
        }

        const imageUrls = [];
        
        // 1. Upload Bundle Images
        for (const file of files) {
            console.log(`   > Uploading ${file}...`);
            const url = await uploadToCloudinary(path.join(bundlePath, file));
            if (url) imageUrls.push(url);
        }

        // 2. Upload Size Guide (if exists)
        if (fs.existsSync(SIZE_GUIDE_PATH)) { 
             console.log(`   > Uploading Size Guide...`);
             const sizeGuideUrl = await uploadToCloudinary(SIZE_GUIDE_PATH);
             if (sizeGuideUrl) imageUrls.push(sizeGuideUrl);
        } else {
             console.warn("   ⚠️ Size Guide not found at: " + SIZE_GUIDE_PATH);
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
            console.log(`   ✅ Bundle Created!`);
        }
    }

    console.log("🎉 Bundles Fixed!");
}

fixBundles()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
