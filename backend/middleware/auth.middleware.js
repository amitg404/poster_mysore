const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      
      // Normalize user object so req.user.id is always available
      req.user = {
        id: decoded.userId || decoded.id,
        ...decoded
      };
      
      console.log(`🔐 Auth Success: ${req.user.id}`);
      return next();
    } catch (error) {
      console.error('❌ Auth Failed:', error.message);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.error('❌ Auth Failed: No Token');
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};
