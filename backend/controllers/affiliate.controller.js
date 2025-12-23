const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get Affiliate Dashboard Data
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id; // From Auth Middleware

    // Fetch User with Affiliate Code
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            referredOrders: {
                select: {
                    id: true,
                    finalAmount: true,
                    status: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                take: 10 // Recent 10 orders
            }
        }
    });

    if (!user || user.role !== 'AFFILIATE') {
        return res.status(403).json({ error: 'Access denied. Affiliate only.' });
    }

    // Generate Code if not exists (Auto-activate)
    let affiliateCode = user.affiliateCode;
    if (!affiliateCode) {
        // Simple code generation: NameInitials + Random Number
        const initials = user.name ? user.name.substring(0, 3).toUpperCase() : 'AF';
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        affiliateCode = `${initials}${randomNum}`;
        
        await prisma.user.update({
            where: { id: userId },
            data: { affiliateCode }
        });
    }

    // Calculate Stats
    const totalEarnings = user.walletBalance || 0;
    const totalOrders = user.referredOrders.length; 
    // real total count might need a separate count query if taking only 10
    const totalOrdersCount = await prisma.order.count({
        where: { affiliateCode: affiliateCode }
    });

    res.json({
        affiliateCode,
        commissionRate: user.commissionRate,
        walletBalance: user.walletBalance,
        totalOrders: totalOrdersCount,
        recentOrders: user.referredOrders
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
