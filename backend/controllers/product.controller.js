const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

exports.getAllProducts = async (req, res) => {
  try {
     const { category, search, vibes } = req.query;
    console.log(`📡 Fetch Products: Cat='${category}', Search='${search}', Vibes='${vibes}', Limit=${req.query.limit}`);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Priority Categories Configuration
    const PRIORITY_CATEGORIES = ['Anime', 'Movie', 'Movies', 'TV Shows', 'Tv Shows', 'F1', 'Car', 'Cars', 'Superhero', 'Superheros', 'Nature'];

    let products = [];
    let whereClause = {};

    // Special Logic for "For You": Bucket Fetching to ensure variety
    if (category === 'For You' && vibes) {
        // Safe conversion to string to prevent array crashes
        const vibesStr = Array.isArray(vibes) ? vibes.join(',') : String(vibes);
        const vibeList = vibesStr.split(',').map(v => v.trim()).filter(Boolean);
        if (vibeList.length > 0) {
            // Determine items per vibe to fill the limit (e.g. 50 items / 3 vibes = ~17 each)
            // But we fetch a bit more to ensure quality
            const itemsPerVibe = Math.ceil((limit * 1.5) / vibeList.length);
            
            const fetchPromises = vibeList.map(v => {
                const term = v;
                return prisma.product.findMany({
                    where: {
                        OR: [
                            { category: { contains: term } },
                            { tags: { contains: term } },
                            { description: { contains: term } },
                            { title: { contains: term } }
                        ],
                        AND: [
                            { category: { not: { contains: 'Custom' } } },
                            { category: { not: { contains: 'Bundles' } } },
                            { isAvailable: true } // Only available items
                        ]
                    },
                    orderBy: { createdAt: 'desc' }, // Or random? No, keep it fresh.
                    take: itemsPerVibe
                });
            });

            const results = await Promise.all(fetchPromises);
            // Flatten results
            const allFetched = results.flat();
            
            // Deduplicate by ID
            const seenIds = new Set();
            products = [];
            for (const p of allFetched) {
                if (!seenIds.has(p.id)) {
                    seenIds.add(p.id);
                    products.push(p);
                }
            }
            // (Note: The subsequent Shuffle logic will balance these nicely)
        }
    } else if (category && category !== 'All') {
        // Standard Filtering
        whereClause.category = { contains: category };
        whereClause.isAvailable = true; // Only available items
        
        // Exclude Custom/Bundles unless searching
        // Exclude Custom/Bundles unless searching or explicitly requested
        if (!search) {
             const restrictions = [];
             // Only exclude Custom if we aren't looking for it
             if (!category.includes('Custom')) {
                  restrictions.push({ category: { not: { contains: 'Custom' } } });
             }
             // Only exclude Bundles if we aren't looking for it
             if (!category.includes('Bundles')) {
                  restrictions.push({ category: { not: { contains: 'Bundles' } } });
             }
             if (restrictions.length > 0) whereClause.AND = restrictions;
        }

        console.log("🔍 Category Fetch:", category);
        products = await prisma.product.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: skip
        });
    } else {
        // "All" or Search or Landing Page fallback logic handled above?
        // Wait, the logic block lines 60-86 handled "Page 1 All No Search".
        // This block handles specific Category OR Page > 1 OR Search.
        
        // Ensure Custom/Bundles exclusion for general "All" query if skipped Page 1 logic
        if ((!category || category === 'All') && !search) {
             whereClause.AND = [
                { category: { not: { contains: 'Custom' } } },
                { category: { not: { contains: 'Bundles' } } }
            ];
        }
        
        whereClause.isAvailable = true; // Only available items

        // Search Logic
        if (search) {
            whereClause.OR = [
                { title: { contains: search } }, 
                { description: { contains: search } },
                { category: { contains: search } }
            ];
            // Clear bucket fetch exclusion if searching
            delete whereClause.AND; 
        }

        console.log("🔍 Standard Fetch. Where:", JSON.stringify(whereClause).substring(0, 100));
        products = await prisma.product.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: skip
        });
    }
    
    // Balanced Interleaved Shuffle Logic
    // Ensures we don't have 4+ of the same category in a row by round-robin selection
    if (category === 'For You' || (!category || category === 'All')) {
        const balancedProducts = [];
        const productsByCategory = {};

        // 1. Group by Category
        products.forEach(p => {
            // Simplify category name for grouping (e.g. "Anime" from "Animes")
            // Use the first valid word or just the string
            const pCat = p.category ? p.category.split(',')[0].trim() : 'Uncategorized';
            if (!productsByCategory[pCat]) productsByCategory[pCat] = [];
            productsByCategory[pCat].push(p);
        });

        // 2. Shuffle each category internally first
        Object.keys(productsByCategory).forEach(key => {
            for (let i = productsByCategory[key].length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [productsByCategory[key][i], productsByCategory[key][j]] = [productsByCategory[key][j], productsByCategory[key][i]];
            }
        });

        // 3. Round-Robin Interleave
        let categories = Object.keys(productsByCategory);
        let active = true;

        while (active) {
            active = false;
            // Shuffle categories order in each pass to add randomness to the pattern
            // (e.g. not always Anime -> Car -> Movie)
            for (let i = categories.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [categories[i], categories[j]] = [categories[j], categories[i]];
            }

            for (const cat of categories) {
                if (productsByCategory[cat].length > 0) {
                    balancedProducts.push(productsByCategory[cat].pop());
                    active = true;
                }
            }
        }
        products = balancedProducts;
    }
    
    // Parse JSON images
    let formattedProducts = products.map(p => {
        let images = [];
        let tags = [];
        try {
            images = p.images ? JSON.parse(p.images) : [];
            if (!Array.isArray(images)) images = [images]; // Handle single string
            images = images.map(img => {
                if (!img) return '';
                // Robust Cloudinary Path Normalization
                let fixedImg = img.replace('poster_mysore_products', 'postershop');
                
                // Detailed Mappings based on User Screenshot & Input
                const folderMappings = {
                    '/Bundles/': '/bundles/',
                    '/TV Shows/': '/tv_shows/',
                    '/TV%20Shows/': '/tv_shows/',
                    '/TV Show/': '/tv_shows/',
                    '/Japanese Art/': '/Japanese_ART/',
                    '/Japanese%20Art/': '/Japanese_ART/',
                    '/Geometric Art/': '/Geometric_art/',
                    '/Geometric%20Art/': '/Geometric_art/',
                    '/Anime/': '/anime/',
                    '/Music/': '/music/',
                    '/Nature/': '/nature/',
                    '/Movie/': '/movie/',
                    '/Motivational/': '/motivational/',
                    '/Minimalist/': '/minimalist/',
                    '/Sports/': '/sports/',
                    '/Band/': '/band/',
                    '/Gaming/': '/gaming/',
                    '/Abstract/': '/abstract/',
                    '/Vintage/': '/vintage/',
                    '/Sci-fi/': '/Sci-Fi/',
                };

                for (const [key, value] of Object.entries(folderMappings)) {
                     fixedImg = fixedImg.replace(key, value);
                }
                
                return fixedImg.replace('http://localhost:5000', '');
            });
        } catch (e) {
            console.error(`Failed to parse images for product ${p.id}:`, p.images);
            images = [];
        }

        try {
            tags = p.tags ? JSON.parse(p.tags) : [];
        } catch (e) {
             tags = [];
        }

        return {
            ...p,
            images,
            tags
        };
    });

    // Smart Interleave Sort (only if viewing All categories)
    // This logic ensures visually pleasing distribution
    if ((!category || category === 'All') && !search) {
        
        const grouped = {};
        formattedProducts.forEach(p => {
            // Normalize category key for grouping
            if (!grouped[p.category]) grouped[p.category] = [];
            grouped[p.category].push(p);
        });

        // Split categories into Priority and Other
        const allCategories = Object.keys(grouped);
        const priorityKeys = allCategories.filter(c => 
            PRIORITY_CATEGORIES.some(pc => c.toLowerCase().includes(pc.toLowerCase()))
        );
        const otherKeys = allCategories.filter(c => 
            !PRIORITY_CATEGORIES.some(pc => c.toLowerCase().includes(pc.toLowerCase()))
        );

        // Helper function to interleave products from a list of category keys
        const interleaveKeys = (keys) => {
            const result = [];
            let maxLen = 0;
            keys.forEach(c => maxLen = Math.max(maxLen, grouped[c].length));

            for (let i = 0; i < maxLen; i += 2) { // Stride 2
                for (const cat of keys) {
                    if (grouped[cat][i]) result.push(grouped[cat][i]);
                    if (grouped[cat][i+1]) result.push(grouped[cat][i+1]);
                }
            }
            return result;
        };

        const priorityInterleaved = interleaveKeys(priorityKeys);
        const otherInterleaved = interleaveKeys(otherKeys);
        
        // Combine: Priority first, then others
        formattedProducts = [...priorityInterleaved, ...otherInterleaved];
    }

    res.json(formattedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[API] Fetching product ID: "${id}"`); // Debug Log
        
        if (!id) return res.status(400).json({ error: 'Missing ID' });

        const product = await prisma.product.findUnique({ where: { id: id.trim() } });
        if (!product) {
            console.log(`[API] Product not found for ID: "${id}"`);
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({
            ...product,
            images: JSON.parse(product.images).map(img => {
                // Robust Cloudinary Path Normalization
                let fixedImg = img.replace('poster_mysore_products', 'postershop');
                
                const folderMappings = {
                    '/Bundles/': '/bundles/',
                    '/TV Shows/': '/tv_shows/',
                    '/TV%20Shows/': '/tv_shows/',
                    '/TV Show/': '/tv_shows/',
                    '/Japanese Art/': '/Japanese_ART/',
                    '/Japanese%20Art/': '/Japanese_ART/',
                    '/Geometric Art/': '/Geometric_art/',
                    '/Geometric%20Art/': '/Geometric_art/',
                    '/Anime/': '/anime/',
                    '/Music/': '/music/',
                    '/Nature/': '/nature/',
                    '/Movie/': '/movie/',
                    '/Motivational/': '/motivational/',
                    '/Minimalist/': '/minimalist/',
                    '/Sports/': '/sports/',
                    '/Band/': '/band/',
                    '/Gaming/': '/gaming/',
                    '/Abstract/': '/abstract/',
                    '/Vintage/': '/vintage/',
                };

                for (const [key, value] of Object.entries(folderMappings)) {
                     fixedImg = fixedImg.replace(key, value);
                }

                return fixedImg.replace('http://localhost:5000', '');
            }),
            tags: JSON.parse(product.tags)
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Simple in-memory cache for category previews
let cachedPreviews = null;
let lastCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 Hour

exports.getCategoryPreviews = async (req, res) => {
    try {
        // Serve from cache if valid
        const now = Date.now();
        if (cachedPreviews && (now - lastCacheTime < CACHE_DURATION)) {
            // console.log("Serving category previews from cache");
            return res.json(cachedPreviews);
        }

        // Categories targeted for college students
        // Categories requested by user
        const categories = [
            { label: 'Anime', term: 'Anime' },
            { label: 'Cars', term: 'Car' },
            { label: 'Movie', term: 'Movie' },
            { label: 'F1', term: 'F1' },
            { label: 'Superheros', term: 'Superhero' },
            { label: 'Nature', term: 'Nature' },
            { label: 'Music', term: 'Music' },
            { label: 'Motivational', term: 'Motivational' },
            { label: 'Japanese Art', term: 'Japanese' }
        ];

        const previews = await Promise.all(categories.map(async (catObj) => {
            // Fetch up to 10 products
            const products = await prisma.product.findMany({
                where: { 
                    category: {
                        contains: catObj.term
                    },
                    isAvailable: true
                },
                take: 10,
                orderBy: { id: 'asc' }, // Deterministic order for static previews
                select: { images: true }
            });

            // Flatten and clean images
            let validImages = [];
            products.forEach(p => {
                try {
                    const parsed = JSON.parse(p.images);
                    const imagesArray = Array.isArray(parsed) ? parsed : [parsed];
                    const clean = imagesArray
                        .filter(img => img && img.length > 5)
                        .map(img => {
                            let fixedImg = img.replace('poster_mysore_products', 'postershop');
                            const folderMappings = {
                                '/Bundles/': '/bundles/',
                                '/TV Shows/': '/tv_shows/',
                                '/TV%20Shows/': '/tv_shows/',
                                '/TV Show/': '/tv_shows/',
                                '/Japanese Art/': '/Japanese_ART/',
                                '/Japanese%20Art/': '/Japanese_ART/',
                                '/Geometric Art/': '/Geometric_art/',
                                '/Geometric%20Art/': '/Geometric_art/',
                                '/Anime/': '/anime/',
                                '/Music/': '/music/',
                                '/Nature/': '/nature/',
                                '/Movie/': '/movie/',
                                '/Motivational/': '/motivational/',
                                '/Minimalist/': '/minimalist/',
                                '/Sports/': '/sports/',
                                '/Band/': '/band/',
                                '/Gaming/': '/gaming/',
                                '/Abstract/': '/abstract/',
                                '/Vintage/': '/vintage/',
                            };
                            for (const [key, value] of Object.entries(folderMappings)) {
                                fixedImg = fixedImg.replace(key, value);
                            }
                            return fixedImg;
                        });
                    validImages.push(...clean);
                } catch { }
            });

            // Static selection (First 4 valid images)
            const selected = validImages.slice(0, 4);

            if (selected.length > 0) {
                return {
                    name: catObj.label,
                    images: selected
                };
            }
            return null;
        }));

        const finalResults = previews.filter(Boolean);
        
        // Update Cache
        cachedPreviews = finalResults;
        lastCacheTime = now;

        res.json(finalResults);
    } catch (error) {
        console.error("Error fetching category previews:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
