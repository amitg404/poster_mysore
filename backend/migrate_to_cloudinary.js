require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

// Initialize Prisma
const prisma = new PrismaClient();

async function migrateImages() {
    console.log("🚀 Starting Image Migration to Cloudinary...");

    // Check configuration
    if (process.env.CLOUDINARY_URL.includes('<your_api_key>')) {
        console.error("❌ ERROR: CLOUDINARY_URL in .env still contains placeholders.");
        console.error("👉 Please update .env with your real API Key and Secret.");
        process.exit(1);
    }

    // Cloudinary config parses from env automatically if CLOUDINARY_URL is set correct
    // But we verify connection
    try {
        const ping = await cloudinary.api.ping();
        console.log("✅ Cloudinary Connected:", ping);
    } catch (error) {
        console.error("❌ Cloudinary Connection Failed:", error.message);
        process.exit(1);
    }

    const products = await prisma.product.findMany();
    console.log(`📦 Found ${products.length} products to check.`);

    let updatedCount = 0;

    for (const product of products) {
        let images = [];
        try {
            images = JSON.parse(product.images);
        } catch (e) {
            console.warn(`⚠️ JSON Parse error for product ${product.id}`);
            continue;
        }

        let needsUpdate = false;
        const newImages = [];

        for (const imgPath of images) {
            // Check if already a cloud link
            if (imgPath.startsWith('http') && imgPath.includes('cloudinary')) {
                newImages.push(imgPath);
                continue;
            }

            // Clean path: "/uploads/file.jpg" -> "uploads/file.jpg"
            const relativePath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
            const fullPath = path.join(__dirname, relativePath);

            if (fs.existsSync(fullPath)) {
                console.log(`📤 Uploading: ${relativePath}`);
                try {
                    const result = await cloudinary.uploader.upload(fullPath, {
                        folder: "poster_mysore_products",
                        use_filename: true,
                        unique_filename: false,
                    });
                    newImages.push(result.secure_url);
                    needsUpdate = true;
                    console.log(`   ✅ Uploaded: ${result.secure_url}`);
                } catch (uploadErr) {
                    console.error(`   ❌ Upload Failed: ${uploadErr.message}`);
                    newImages.push(imgPath); // Keep original if fail
                }
            } else {
                console.warn(`   ⚠️ File not found locally: ${fullPath}`);
                newImages.push(imgPath);
            }
        }

        if (needsUpdate) {
            await prisma.product.update({
                where: { id: product.id },
                data: { images: JSON.stringify(newImages) }
            });
            updatedCount++;
        }
    }

    console.log(`🎉 Migration Complete! Updated ${updatedCount} products.`);
    await prisma.$disconnect();
}

migrateImages();
