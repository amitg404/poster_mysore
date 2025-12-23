const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
const path = require('path');
const errorMiddleware = require('./middleware/error.middleware');

// Serve static files from 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const productRoutes = require('./routes/product.routes');
app.use('/api/products', productRoutes);

const uploadRoutes = require('./routes/upload.routes');
app.use('/api/upload', uploadRoutes);

const affiliateRoutes = require('./routes/affiliate.routes');
app.use('/api/affiliate', affiliateRoutes);

const cartRoutes = require('./routes/cart.routes');
app.use('/api/cart', cartRoutes);

const orderRoutes = require('./routes/order.routes');
app.use('/api/orders', orderRoutes);

const paymentRoutes = require('./routes/payment.routes');
app.use('/api/payment', paymentRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('PosterShop Backend is Running!');
});

const chokidar = require('chokidar');

// Database Connection Check
async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to Database');
    
    // Initialize File Watcher for Real-time Sync - ONLY IN DEVELOPMENT
    if (process.env.NODE_ENV !== 'production') {
        const uploadsDir = path.join(__dirname, 'uploads');
        // Ensure uploads directory exists
        const fs = require('fs');
        if (!fs.existsSync(uploadsDir)){
            fs.mkdirSync(uploadsDir);
        }

        const watcher = chokidar.watch(uploadsDir, {
            persistent: true,
            ignoreInitial: true, // Don't re-process everything on startup
            depth: 0,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        console.log('👀 Watching for file changes in /uploads...');

        watcher
            .on('add', async (filePath) => {
                const filename = path.basename(filePath);
                if (!filename.match(/\.(jpg|jpeg|png|webp)$/i)) return;

                console.log(`✨ File Added: ${filename}`);
                try {
                    // Extract metadata from filename (Format: Category-Filename.ext)
                    const ext = path.extname(filename);
                    // Try to split by FIRST hyphen if possible, or just treat as generic
                    // Our format: Category_Name-Filename
                    const parts = filename.split('-');
                    let category = 'Uncategorized';
                    let title = path.basename(filename, ext).replace(/[-_]/g, ' ');

                    if (parts.length > 1) {
                        // Best effort category extraction
                        const catRaw = parts[0].replace(/_/g, ' '); 
                        // Capitalize
                        category = catRaw.replace(/\b\w/g, c => c.toUpperCase());
                        // Title is the rest
                        title = parts.slice(1).join(' ').replace(ext, '').replace(/[-_]/g, ' ');
                        title = title.replace(/\b\w/g, c => c.toUpperCase());
                    }

                    const imageUrl = `http://localhost:5000/uploads/${filename}`;
                    
                    await prisma.product.create({
                        data: {
                            title: title,
                            description: `New ${category} poster.`,
                            price: 399,
                            images: JSON.stringify([imageUrl]),
                            category: category,
                            tags: JSON.stringify([category.toLowerCase(), "new"]),
                        }
                    });
                    console.log(`   ✅ DB Record Created: ${title}`);
                } catch (e) {
                    console.error('   ❌ Add Failed:', e);
                }
            })
            .on('unlink', async (filePath) => {
                const filename = path.basename(filePath);
                console.log(`🗑️ File Deleted: ${filename}`);
                try {
                    // Find product by image URL containing this filename
                    // This is a bit expensive (tablescan) if we don't index, but fine for now
                    // "contains" might be risky if filename is short, but our filenames are unique-ish
                    const products = await prisma.product.findMany({
                        where: {
                            images: { contains: filename }
                        }
                    });

                    for (const p of products) {
                        try {
                            await prisma.product.delete({ where: { id: p.id } });
                            console.log(`   ✅ DB Record Deleted: ${p.title}`);
                        } catch (err) {
                            if (err.code === 'P2003') {
                                console.warn(`   ⚠️ Soft Keep: Product referenced in Orders (${p.title})`);
                            }
                        }
                    }
                } catch (e) {
                    console.error('   ❌ Delete Failed:', e);
                }
            });
    }

  } catch (error) {
    console.error('❌ Database Connection Failed:', error);
  }
}

app.use(errorMiddleware);

main();

// Vercel requires exporting the app
module.exports = app;

// Only listen if run directly (development)
if (require.main === module) {
    app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
