const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Vendor = require('../models/vendorModel');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret123');

      // Get user from the token based on role
      if (decoded.role === 'vendor') {
        req.user = await Vendor.findById(decoded.id).select('-password');
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const optionalProtect = async (req, res, next) => {
  if (!(req.headers.authorization && req.headers.authorization.startsWith('Bearer'))) {
    return next();
  }
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret123');
    if (decoded.role === 'vendor') {
      req.user = await Vendor.findById(decoded.id).select('-password');
    } else {
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch {
    req.user = null;
  }
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user?.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize, optionalProtect };
