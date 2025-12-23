const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupCoupons() {
  try {
    console.log("Starting coupon cleanup...");
    
    // Find affiliates to delete
    // We want to delete users with role 'AFFILIATE' where affiliateCode is NOT 'JUST9'
    // Note: Prisma string filter for not equals
    
    const result = await prisma.user.deleteMany({
      where: {
        role: 'AFFILIATE',
        affiliateCode: {
          not: 'JUST9', 
          mode: 'insensitive' // Ensure we don't accidentally keep 'just9' if we meant 'JUST9' case-sensitive, though typically code is uppercase. 
                              // Actually Prisma postgres insensitive might need validation, standard string check is safer.
        }
      }
    });

    console.log(`Deleted ${result.count} affiliate coupons.`);
    
    // Check if JUST9 exists (optional info)
    const just9 = await prisma.user.findFirst({
        where: { affiliateCode: 'JUST9' }
    });
    
    if (just9) {
        console.log("Preserved 'JUST9' coupon (User ID: " + just9.id + ")");
    } else {
        console.log("'JUST9' does not exist in DB (Hardcoded logic handles it).");
    }

  } catch (error) {
    console.error("Error cleaning up coupons:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupCoupons();
