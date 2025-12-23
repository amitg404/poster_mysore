const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seeding...');

  // 1. Clean existing data (optional, maybe keep users)
  // await prisma.product.deleteMany(); 
  // await prisma.orderItem.deleteMany(); // Careful purely dev

  // 2. Define Products (Posters)
  const products = [
    {
      title: "Neon City Cyberpunk",
      description: "Futuristic night city view with neon lights.",
      price: 499,
      images: JSON.stringify(["https://images.unsplash.com/photo-1577004467368-80e5b7c7b605?q=80&w=2070&auto=format&fit=crop"]),
      category: "Anime",
      tags: JSON.stringify(["cyberpunk", "city", "neon"]),
    },
    {
      title: "Samurai Spirit",
      description: "Traditional samurai silhouette against a red moon.",
      price: 449,
      images: JSON.stringify(["https://images.unsplash.com/photo-1620211145104-58672520624d?q=80&w=1974&auto=format&fit=crop"]),
      category: "Anime",
      tags: JSON.stringify(["japan", "warrior", "red"]),
    },
    {
      title: "Abstract Waves",
      description: "Fluid colorful waves for a modern vibe.",
      price: 399,
      images: JSON.stringify(["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"]),
      category: "Abstract",
      tags: JSON.stringify(["colorful", "fluid", "modern"]),
    },
    {
      title: "Minimalist Mountains",
      description: "Clean line art of mountain ranges.",
      price: 299,
      images: JSON.stringify(["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"]),
      category: "Minimalist",
      tags: JSON.stringify(["nature", "blackandwhite"]),
    },
    {
      title: "Vintage Rock Concert",
      description: "Retro style rock band poster.",
      price: 599,
      images: JSON.stringify(["https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=2070&auto=format&fit=crop"]),
      category: "Music",
      tags: JSON.stringify(["rock", "retro", "concert"]),
    },
    {
      title: "Interstellar Dreams",
      description: "Space exploration concept art.",
      price: 499,
      images: JSON.stringify(["https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"]),
      category: "Movies",
      tags: JSON.stringify(["space", "scifi", "stars"]),
    },
    {
      title: "Gaming Setup Goals",
      description: "High tech battlestation aesthetic.",
      price: 399,
      images: JSON.stringify(["https://images.unsplash.com/photo-1616588589676-60b30c3c1681?q=80&w=2070&auto=format&fit=crop"]),
      category: "Gaming",
      tags: JSON.stringify(["setup", "rgb", "tech"]),
    },
    {
      title: "Motivational Hustle",
      description: "Grind now, shine later typography.",
      price: 299,
      images: JSON.stringify(["https://images.unsplash.com/photo-1552508744-1696d4464960?q=80&w=2070&auto=format&fit=crop"]),
      category: "Motivational",
      tags: JSON.stringify(["text", "typography", "work"]),
    }
  ];

  console.log(`Creating ${products.length} products...`);

  for (const p of products) {
    await prisma.product.create({
      data: p
    });
  }

  console.log('✅ Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
