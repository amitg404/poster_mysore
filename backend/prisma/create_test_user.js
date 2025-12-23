```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
    const mobile = "9876543210"; // Test Mobile
    const password = "password123";

    console.log("Creating test user...");

    const existing = await prisma.user.findUnique({ where: { mobile } });

    if (existing) {
        console.log(`✅ User ${mobile} already exists.`);
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name: "Amit Test",
            mobile: mobile,
            password: hashedPassword,
            role: "ADMIN"
        }
    });

    console.log(`✅ Created user: ${user.mobile} with password: ${password}`);
})()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
```
