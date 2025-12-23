
async function checkOrder() {
    try {
        const res = await fetch('http://localhost:5001/api/products?limit=20');
        const data = await res.json();
        const categories = data.map(p => p.category);
        console.log("Top 20 Categories:");
        console.log(categories);
        
        const priority = ['Anime', 'Movie', 'Movies', 'TV Shows', 'Tv Shows', 'F1', 'Car', 'Cars', 'Superhero', 'Superheros', 'Nature'];
        const firstIsPriority = priority.some(p => categories[0].toLowerCase().includes(p.toLowerCase()));
        
        console.log(`First item is priority class? ${firstIsPriority}`);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkOrder();
