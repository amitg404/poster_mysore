const axios = require('axios');

async function testBundles() {
    try {
        console.log("Testing /api/products?category=Bundles...");
        const res = await axios.get('http://localhost:5000/api/products?category=Bundles');
        console.log(`Status: ${res.status}`);
        console.log(`Count: ${res.data.length}`);
        if (res.data.length > 0) {
            console.log("SUCCESS: Bundles found!");
            res.data.forEach(p => console.log(` - ${p.title} (${p.category})`));
        } else {
            console.log("FAILURE: Still 0 results.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testBundles();
