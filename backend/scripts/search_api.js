require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const envPathBackend = path.join(process.cwd(), 'backend', '.env');
const envPathRoot = path.join(process.cwd(), '.env');

if (fs.existsSync(envPathBackend)) {
    require('dotenv').config({ path: envPathBackend });
} else if (fs.existsSync(envPathRoot)) {
    require('dotenv').config({ path: envPathRoot });
} else {
    require('dotenv').config();
}

async function searchCloudinary() {
    console.log("🔍 Search API Mode...");

    if (!process.env.CLOUDINARY_URL) {
        console.error("❌ CLOUDINARY_URL missing.");
        process.exit(1);
    }

    try {
        // Search for 'Abstact' or 'car' (lowercase) anywhere in public_id
        // Note: Check case sensitivity. 
        // We want strict match for 'poster_mysore_products/car' maybe?
        
        const expression = 'folder:poster_mysore_products/* AND (public_id:*Abstact* OR public_id:*/car/* OR public_id:*_car_*)';
        // Note: Search API is powerful but syntax must be precise.
        // Try simple substring first.
        
        console.log(`Querying: public_id:*Abstact*`);
        const result1 = await cloudinary.search
            .expression('public_id:*Abstact*')
            .max_results(100)
            .execute();
            
        console.log(`Found ${result1.total_count} items with 'Abstact':`);
        result1.resources.forEach(r => console.log(` - ${r.public_id}`));

        console.log(`\nQuerying: public_id:*poster_mysore_products/car* (lowercase)`);
        const result2 = await cloudinary.search
            .expression('public_id:poster_mysore_products/car*') // Starts with...
            .max_results(100)
            .execute();
            
        console.log(`Found ${result2.total_count} items with 'poster_mysore_products/car*':`);
        result2.resources.forEach(r => console.log(` - ${r.public_id}`));

    } catch (e) {
        console.error("❌ Search API Failed:", e.message);
        console.error("NOTE: Admin API does not support search unless strictly configured, we are using the Search API method.");
    }
}

searchCloudinary();
