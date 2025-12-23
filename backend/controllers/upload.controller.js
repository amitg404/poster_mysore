const multer = require('multer');
const path = require('path');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary only if URL is present (fallback to local if not set or invalid)
if (process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_URL.includes('<your_api_key>')) {
   console.log("☁️ Using Cloudinary Storage");
} else {
   console.warn("⚠️ CLOUDINARY_URL not set or valid. Falling back to local storage (deployment will break).");
}

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'poster_mysore_products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

/* 
// Fallback to Disk Storage if needed (Optional, usually we pick one)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => ...
});
*/

// File Filter (Images only) can be handled by Cloudinary params mostly, but multer filter is good
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

exports.uploadMiddleware = upload.single('image');

exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Cloudinary returns the URL in `req.file.path`
  res.json({ 
    message: 'Image uploaded successfully to Cloud',
    url: req.file.path,
    filename: req.file.filename
  });
};
