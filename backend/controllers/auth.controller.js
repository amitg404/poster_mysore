const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Email Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail', // or use host/port from env
    auth: {
        user: process.env.SMTP_EMAIL || 'poster.mysore@gmail.com', // Placeholder if not set
        pass: process.env.SMTP_PASSWORD || '' 
    }
});

exports.signup = async (req, res) => {
  const { name, mobile, email, password, role } = req.body;
  
  // Basic validation: User must provide at least one identifier
  if (!mobile && !email) {
      return res.status(400).json({ error: 'Please provide either Mobile Number or Email.' });
  }

  try {
    // Check for existing user
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                mobile ? { mobile } : {},
                email ? { email } : {}
            ]
        }
    });

    if (existingUser) {
        if (mobile && existingUser.mobile === mobile) return res.status(400).json({ error: 'Mobile number already registered' });
        if (email && existingUser.email === email) return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Affiliate Code Generation
    let affiliateCode = null;
    if (role === 'AFFILIATE') {
        const cleanName = name ? name.replace(/\s/g, '').toUpperCase().substring(0, 4) : 'USER';
        affiliateCode = `${cleanName}${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const user = await prisma.user.create({
      data: {
        name,
        mobile: mobile || null, // Ensure explicit null if empty string
        email: email || null,
        password: hashedPassword,
        role: role || 'USER',
        affiliateCode
      }
    });

    // Generate Token immediately? 
    // Usually signup -> login, but auto-login is fine.
    // Let's just return success.
    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body; // identifier = mobile or email

  if (!identifier || !password) {
      return res.status(400).json({ error: 'Please provide identifier and password' });
  }

  try {
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { mobile: identifier },
                { email: identifier }
            ]
        }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, role: user.role, affiliateCode: user.affiliateCode },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '7d' }
    );

    const ordersCount = await prisma.order.count({ where: { userId: user.id } });

    res.json({
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            affiliateCode: user.affiliateCode,
            orderCount: ordersCount // Crucial for First Order logic
        }
    });


  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required to reset password' });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Generate a simple random password
        const newPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update DB
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        // Send Email
        const mailOptions = {
            from: process.env.SMTP_EMAIL || 'admin@postermysore.com',
            to: email,
            subject: 'Password Reset - Poster Mysore',
            text: `Your password has been reset. Your new password is: ${newPassword}\n\nPlease login and change it immediately.`
        };

        // If credentials are valid, send. Else log for dev mode.
        if (process.env.SMTP_PASSWORD) {
             await transporter.sendMail(mailOptions);
             console.log(`Password reset email sent to ${email}`);
        } else {
             console.log("==========================================");
             console.log(`[DEV MODE] Password Reset for ${email}`);
             console.log(`New Password: ${newPassword}`);
             console.log("Set SMTP_EMAIL and SMTP_PASSWORD in .env to send real emails.");
             console.log("==========================================");
        }

        res.json({ message: 'Password reset successful. Check your email (or console in dev).' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const ordersCount = await prisma.order.count({ where: { userId: user.id } });

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            affiliateCode: user.affiliateCode,
            orderCount: ordersCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
