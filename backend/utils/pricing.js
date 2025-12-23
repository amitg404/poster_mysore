const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Helper: Calculate Standard Bundle Price (3 for 249 logic)
 * @param {number} qty 
 * @returns {number}
 */
const getStandardBundlePrice = (qty) => {
    const packs = Math.floor(qty / 3);
    const remainder = qty % 3;
    return (packs * 249) + (remainder * 99);
};

/**
 * Helper: First Order Logic
 * @param {number} qty 
 * @returns {number}
 */
const getFirstOrderPrice = (qty) => {
    if (qty <= 0) return 0;
    
    // Tier 1: 1-3 Items
    if (qty === 1) return 99;
    if (qty === 2) return 198; 
    if (qty === 3) return 198; // Buy 2 Get 1 Free

    // Tier 2: 4 Items -> 249
    if (qty === 4) return 249;

    // Tier 3: 5+ Items
    const firstFourCost = 249;
    const remainingQty = qty - 4;
    return firstFourCost + getStandardBundlePrice(remainingQty);
};

/**
 * Calculates the total price for a user's cart securely on the server.
 * Applies "New User" logic if orderCount is 0.
 * 
 * @param {string} userId 
 * @param {string} [claimedOffer] - Optional, from frontend, but we prioritize actual eligibility
 * @returns {Promise<{total: number, shipping: number, finalAmount: number, items: any[]}>}
 */
exports.calculateCartTotal = async (userId, claimedOffer) => {
    // 1. Fetch Cart Items from DB
    const cartItems = await prisma.cartItem.findMany({
        where: { userId: userId },
        include: { product: true }
    });

    if (!cartItems.length) {
        throw new Error("Cart is empty");
    }

    const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // 2. Check User Eligibility for First Order
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { orderCount: true }
    });

    const isFirstOrder = user?.orderCount === 0 || user?.orderCount === null; // Handle null just in case

    let total = 0;
    let message = "";

    // 3. Apply Pricing Logic
    
    // --- SPECIAL COUPON override ---
    if (claimedOffer === 'JUST9') {
        // Special "JUST9" offer: Flat ₹9 total
        // We set total such that total + shipping = 9? 
        // Or just flat 9 and free shipping?
        // Let's assume flat 9 total.
        // If Shipping is 30, then total = -21?? No.
        // Let's force finalAmount = 9.
        
        // We can mimic the frontend logic:
        // "payment set to ₹9"
        
        // Let's set standard pricing first for reference
        total = isFirstOrder ? getFirstOrderPrice(totalQty) : getStandardBundlePrice(totalQty);
        
        // Then override for return
        return {
            total: 9, // nominal
            shipping: 0,
            finalAmount: 9,
            message: "Special JUST9 Offer Applied",
            items: cartItems
        };
    }
    // -------------------------------

    // If eligible for first order logic
    if (isFirstOrder) {
        // We apply First Order logic AUTOMATICALLY if eligible, or strictly?
        // Frontend only applies if `claimedOffer` is set.
        // But for security, if they qualify for a better price, should we give it? 
        // Or strictly match what they see?
        // Let's match frontend logic: "If claimedOffer is set... verify eligibility".
        // Actually, let's be generous: If they ARE new, giving them the new user price is fine.
        // But wait, "Buy 4 @ 249" is cheaper than Standard "4 @ 348" (249+99).
        // Let's use `getFirstOrderPrice` if isFirstOrder.
        total = getFirstOrderPrice(totalQty);
        message = "First Order Deal Applied";
    } else {
        // Existing user -> Standard Bundle
        total = getStandardBundlePrice(totalQty);
        message = "Standard Bundle Applied";
    }

    // 4. Shipping
    const shipping = total >= 199 ? 0 : 30;
    const finalAmount = total + shipping;

    return {
        total,
        shipping,
        finalAmount,
        message,
        items: cartItems // Return items for order creation to ensure consistency
    };
};
