const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUNDLE_UPDATES = [
    {
        title: 'Avengers Bundle',
        images: [
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069511/postershop/bundles/Avengers_479rs/The_Avengers.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069479/postershop/bundles/Avengers_479rs/Avengers_Age_Of_Ultron.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069495/postershop/bundles/Avengers_479rs/Avengers_Infinity_War.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069491/postershop/bundles/Avengers_479rs/Avengers_Endgame.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069481/postershop/bundles/Avengers_479rs/Avengers_Doomsday.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069499/postershop/bundles/Avengers_479rs/Avengers_Secret_wars.jpg"
        ]
    },
    {
        title: 'F1 Bundle',
        images: [
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069531/postershop/bundles/F1_teams_479/Redbull_max.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069529/postershop/bundles/F1_teams_479/Redbull.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069527/postershop/bundles/F1_teams_479/Mercedes_Hamilton.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069525/postershop/bundles/F1_teams_479/Mclaren.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069517/postershop/bundles/F1_teams_479/Ferrari_charles.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069514/postershop/bundles/F1_teams_479/Ferrari.jpg"
        ]
    },
    {
        title: 'Luffy Crew Wanted Posters',
        images: [
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069562/postershop/bundles/Luffy_Gang_wanted_posters_799Rs/luffy.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069574/postershop/bundles/Luffy_Gang_wanted_posters_799Rs/zoro.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069570/postershop/bundles/Luffy_Gang_wanted_posters_799Rs/sanji.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069566/postershop/bundles/Luffy_Gang_wanted_posters_799Rs/nami.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069572/postershop/bundles/Luffy_Gang_wanted_posters_799Rs/usopp.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069567/postershop/bundles/Luffy_Gang_wanted_posters_799Rs/nico_robin.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069553/postershop/bundles/Luffy_Gang_wanted_posters_799Rs/franky.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069550/postershop/bundles/Luffy_Gang_wanted_posters_799Rs/chopper.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069548/postershop/bundles/Luffy_Gang_wanted_posters_799Rs/brook.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069559/postershop/bundles/Luffy_Gang_wanted_posters_799Rs/jinbe.jpg"
        ]
    },
    {
        title: 'Supercars',
        images: [
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069677/postershop/bundles/Super_cars_799Rs/mclaren_Nero_AI_Business_Face.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069671/postershop/bundles/Super_cars_799Rs/lexus_Nero_AI_Photo_Face.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069661/postershop/bundles/Super_cars_799Rs/lambo_Nero_AI_Business_Face.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069653/postershop/bundles/Super_cars_799Rs/laferrari_Nero_AI_Photo_Face.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069642/postershop/bundles/Super_cars_799Rs/koenisegg_Nero_AI_Photo_Face.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069619/postershop/bundles/Super_cars_799Rs/gttr_Nero_AI_Photo_Face.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069612/postershop/bundles/Super_cars_799Rs/gttr_Nero_AI_Business_Face.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069606/postershop/bundles/Super_cars_799Rs/bmw_Nero_AI_Business_Face.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069597/postershop/bundles/Super_cars_799Rs/audi_Nero_AI_Business_Face.jpg",
            "https://res.cloudinary.com/dsrun1xw6/image/upload/v1766069589/postershop/bundles/Super_cars_799Rs/amg_gt_Nero_AI_Business_Face.jpg"
        ]
    }
];

async function main() {
    try {
        console.log("🛠️  Forcing Bundle Content Update...");
        
        for (const update of BUNDLE_UPDATES) {
            const product = await prisma.product.findFirst({
                where: { 
                    category: 'Bundles',
                    title: update.title
                }
            });

            if (product) {
                console.log(`✅ Updating ${update.title} with ${update.images.length} specific images...`);
                await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        images: JSON.stringify(update.images),
                        description: `${product.title} - Contains ${update.images.length} Premium Posters.` // Update description count too
                    }
                });
            } else {
                console.error(`❌ Could not find bundle: ${update.title}`);
            }
        }
        
        console.log("✅ All enforced updates complete.");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
