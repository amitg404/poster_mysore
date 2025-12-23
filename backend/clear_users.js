
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("⚠️ Clearing All User Accounts...");
  
  // Delete dependent data first if cascade isn't set up, but usually Prisma handles cascade if defined in schema.
  // Assuming Schema: User -> Orders, CartItems
  // Safest to delete child tables first or use deleteMany
  
  try {
      await prisma.cartItem.deleteMany({});
      console.log("✅ Cleared Cart Items");

      await prisma.order.deleteMany({});
      console.log("✅ Cleared Orders");

      await prisma.user.deleteMany({});
      console.log("✅ Cleared Users");
      
  } catch (e) {
      console.error("Error clearing users:", e);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
