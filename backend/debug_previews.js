async function check() {
    try {
        const res = await fetch('http://localhost:5000/api/products/previews');
        const data = await res.json();
        console.log("Response Sample (First Category):");
        if (data.length > 0) {
            console.log(JSON.stringify(data[0], null, 2));
        } else {
            console.log("No previews found.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

check();
