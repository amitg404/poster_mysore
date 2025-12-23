# 🎨 PosterShop — Premium A3 Poster E-Commerce Platform

<div align="center">

![PosterShop](https://img.shields.io/badge/PosterShop-E--Commerce-22c55e?style=for-the-badge&logo=shopify&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)

**A full-stack e-commerce platform for premium A3 posters with AI-powered personalization, print automation, and real-time order processing.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [API Reference](#-api-reference)

</div>

---

## 🚀 Features

### 🛍️ Customer Experience

- **Personalized "Vibe Check"** — AI-curated poster recommendations based on user preferences (Anime, Movies, Music, Sports, etc.)
- **Dynamic Category Collages** — 2x2 preview tiles with blur effects and smooth hover animations
- **Dark/Light Theme** — Full theme support with persistent user preferences
- **Real-time Cart Updates** — Zustand-powered state management with cart animations
- **Bundle Deals** — Curated poster bundles (Anime Pack, Movie Pack, F1 Collection, etc.) at discounted prices
- **Student Offers** — Special pricing tiers with free shipping thresholds

### 💳 Payments & Orders

- **Razorpay Integration** — Secure payment gateway with order verification using HMAC-SHA256 signature validation
- **Server-Side Price Validation** — Tamper-proof pricing with security logging for price mismatch detection
- **Instant Notifications** — Real-time order alerts via [ntfy.sh](https://ntfy.sh) push notifications
- **Email Confirmations** — Automated order confirmation emails with order details

### 🖨️ Print Automation Pipeline

- **Email Listener** — Python daemon monitoring Gmail for "Print Order" emails
- **Real-ESRGAN Upscaling** — AI image upscaling (4x) using `realesrgan-ncnn-vulkan` for print-quality output
- **PDF Generation** — Automatic conversion of upscaled images to print-ready PDFs
- **Database Integration** — Direct PostgreSQL queries to fetch Cloudinary image URLs

### 🖼️ Media Management

- **Cloudinary CDN** — All poster assets served via Cloudinary with optimized delivery
- **Auto-Sync Watcher** — Chokidar file watcher for automatic product creation when new images are added
- **Custom Upload Support** — User-uploaded images for custom poster creation

### 🔐 Authentication & Users

- **JWT Authentication** — Secure token-based auth with bcryptjs password hashing
- **Affiliate System** — Commission tracking with unique affiliate codes
- **Wallet System** — Affiliate earnings management with withdrawal support

---

## 🛠️ Tech Stack

### Frontend

| Technology        | Version | Purpose                           |
| ----------------- | ------- | --------------------------------- |
| **Next.js**       | 16.1.0  | React framework with App Router   |
| **React**         | 19.2.1  | UI library (latest with Compiler) |
| **TypeScript**    | 5.x     | Type safety                       |
| **Tailwind CSS**  | 4.x     | Utility-first styling             |
| **Framer Motion** | 12.x    | Animations & transitions          |
| **Zustand**       | 5.0.9   | Lightweight state management      |
| **Sonner**        | 2.0.7   | Toast notifications               |
| **Lucide React**  | 0.559.0 | Icon library                      |

### Backend

| Technology     | Version | Purpose               |
| -------------- | ------- | --------------------- |
| **Express.js** | 5.2.1   | REST API server       |
| **Prisma**     | 5.19.1  | Type-safe ORM         |
| **PostgreSQL** | (Neon)  | Cloud database        |
| **Cloudinary** | 1.41.3  | Image storage & CDN   |
| **Razorpay**   | 2.9.6   | Payment processing    |
| **Nodemailer** | 7.0.11  | Email service         |
| **Chokidar**   | 3.6.0   | File system watcher   |
| **JWT**        | 9.0.3   | Authentication tokens |
| **bcryptjs**   | 3.0.3   | Password hashing      |

### Print Automation (Python)

| Technology                  | Purpose                           |
| --------------------------- | --------------------------------- |
| **Real-ESRGAN ncnn-vulkan** | 4x AI upscaling for print quality |
| **img2pdf**                 | Image to PDF conversion           |
| **psycopg2**                | PostgreSQL driver                 |
| **imaplib**                 | Gmail IMAP integration            |

---

## 📐 Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Next.js 16 (App Router) + React 19 + TypeScript                    │ │
│  │  ├── pages: Home, Catalog, Cart, Product, Create, Orders            │ │
│  │  ├── components: Navbar, VibePickerModal, SettingsModal, etc.       │ │
│  │  └── store: Zustand (cart, ui, auth)                                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                  │                                        │
│                                  ▼                                        │
│                          ┌──────────────┐                                 │
│                          │   Vercel     │                                 │
│                          │   (Deploy)   │                                 │
│                          └──────────────┘                                 │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ REST API
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Express.js 5 + Prisma ORM                                          │ │
│  │  ├── routes: auth, products, cart, orders, payment, affiliate       │ │
│  │  ├── controllers: Business logic with security validations          │ │
│  │  └── middleware: JWT auth, error handling                           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                    │                    │                                 │
│                    ▼                    ▼                                 │
│          ┌─────────────────┐   ┌─────────────────┐                       │
│          │   PostgreSQL    │   │   Cloudinary    │                       │
│          │   (Neon Cloud)  │   │   (CDN/Media)   │                       │
│          └─────────────────┘   └─────────────────┘                       │
│                                        │                                  │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Order Webhooks / Emails
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         PRINT AUTOMATION                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Python Daemon                                                       │ │
│  │  ├── Gmail IMAP Listener (30min polling)                            │ │
│  │  ├── Real-ESRGAN 4x Upscaling (ncnn-vulkan GPU)                     │ │
│  │  └── PDF Generation (img2pdf)                                       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                  │                                        │
│                                  ▼                                        │
│                          ┌──────────────┐                                 │
│                          │ Print-Ready  │                                 │
│                          │    PDFs      │                                 │
│                          └──────────────┘                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
poster_mysore/
├── frontend/                    # Next.js 16 Application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── page.tsx        # Homepage with hero & vibe tiles
│   │   │   ├── catalog/        # Product listing with filters
│   │   │   ├── cart/           # Shopping cart
│   │   │   ├── product/        # Product detail page
│   │   │   ├── create/         # Custom poster upload
│   │   │   ├── orders/         # Order history
│   │   │   ├── bundle-offer/   # Bundle deals
│   │   │   └── student-offers/ # Student pricing
│   │   ├── components/         # React components
│   │   │   ├── Navbar.tsx
│   │   │   ├── VibePickerModal.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   └── ...
│   │   ├── store/              # Zustand stores
│   │   └── lib/                # Utilities
│   └── package.json
│
├── backend/                     # Express.js API
│   ├── index.js                # Server entry point
│   ├── controllers/            # Business logic
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── payment.controller.js
│   │   ├── cart.controller.js
│   │   └── order.controller.js
│   ├── routes/                 # API routes
│   ├── middleware/             # Auth & error handling
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── utils/
│   │   ├── pricing.js          # Price calculations
│   │   └── emailService.js     # Nodemailer
│   └── scripts/                # Admin/migration scripts
│
├── Email_automation_final/      # Print Automation
│   ├── main.py                 # Email listener daemon
│   ├── requirements.txt
│   └── realesrgan-ncnn-vulkan.exe
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Python 3.9+
- PostgreSQL (or Neon account)
- Cloudinary account
- Razorpay account

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/poster_mysore.git
cd poster_mysore
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
JWT_SECRET="your-secret-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_EMAIL="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

Initialize database:

```bash
npx prisma generate
npx prisma db push
```

Start server:

```bash
npm run dev
```

#### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:4000`

#### 4. Print Automation Setup (Optional)

```bash
cd Email_automation_final
pip install -r requirements.txt
python main.py
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | User registration |
| POST   | `/api/auth/login`    | User login        |

### Products

| Method | Endpoint                 | Description                  |
| ------ | ------------------------ | ---------------------------- |
| GET    | `/api/products`          | List products (with filters) |
| GET    | `/api/products/previews` | Category preview images      |
| GET    | `/api/products/:id`      | Product details              |

### Cart

| Method | Endpoint        | Description      |
| ------ | --------------- | ---------------- |
| GET    | `/api/cart`     | Get user cart    |
| POST   | `/api/cart/add` | Add to cart      |
| DELETE | `/api/cart/:id` | Remove from cart |

### Payments

| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| POST   | `/api/payment/create-order` | Create Razorpay order    |
| POST   | `/api/payment/verify`       | Verify payment signature |

---

## 🛡️ Security Features

- **Server-side price validation** — All prices recalculated server-side before payment
- **HMAC-SHA256 signature verification** — Razorpay payment verification
- **JWT authentication** — Secure token-based sessions
- **bcrypt password hashing** — Industry-standard password security
- **Input sanitization** — Protection against injection attacks

---

## 📊 Database Schema

```prisma
model User {
  id            String   @id @default(uuid())
  mobile        String?  @unique
  email         String?  @unique
  password      String
  name          String?
  role          String   @default("USER")
  affiliateCode String?  @unique
  commissionRate Float   @default(0.10)
  walletBalance Float    @default(0.0)
}

model Product {
  id          String   @id @default(uuid())
  title       String
  description String
  price       Float
  images      String   // JSON string
  category    String
  tags        String   // JSON string
  stock       Int      @default(100)
  isAvailable Boolean  @default(true)
}

model Order {
  id              String      @id @default(uuid())
  userId          String
  totalAmount     Float
  finalAmount     Float
  status          String      @default("PENDING")
  paymentId       String?
}
```

---

## 🎯 Roadmap

- [ ] Multi-language support (English, Hindi, Kannada, Tamil, Telugu)
- [ ] A4/A2 size variants
- [ ] WhatsApp checkout integration
- [ ] PWA offline support
- [ ] Admin dashboard

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👨‍💻 Author

**Amit G**

Built with ❤️ in Mysore, India

---

<div align="center">

**⭐ Star this repo if you found it useful!**

</div>
