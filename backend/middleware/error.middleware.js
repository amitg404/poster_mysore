const errorMiddleware = (err, req, res, next) => {
    // Default status code: 500
    const statusCode = err.statusCode || 500;
    
    // Default error message
    let message = err.message || 'Server Error';
  
    // Specific Prismsa Errors (if any specific ones pop up commonly)
    // code P2002: Unique constraint failed
    if (err.code === 'P2002') {
        message = 'Duplicate field value entered';
        // statusCode = 400; // You might want to change status too
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token';
        // statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        message = 'Token expired';
        // statusCode = 401;
    }
  
    const fs = require('fs');
    const path = require('path');
    console.error(`❌ Error [${req.method} ${req.originalUrl}]:`, err);
    
    try {
        const logPath = path.join(__dirname, '../error.log');
        const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}\n${err.stack}\n\n`;
        fs.appendFileSync(logPath, logEntry);
    } catch (e) {
        console.error("Failed to write to error log:", e);
    }
  
    res.status(statusCode).json({
      success: false,
      error: message,
      // Only show stack in development
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  };
  
  module.exports = errorMiddleware;
