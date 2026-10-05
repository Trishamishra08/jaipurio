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

/**
 * Finer-grained check on top of authorize('admin') — looks up the admin's
 * assigned Role and requires `key` in its permissions ('all' bypasses this
 * entirely, i.e. Super Administrator). An admin with no adminRole assigned
 * is denied, not silently let through, so this fails closed.
 * Use after protect + authorize('admin'): [protect, authorize('admin'), requirePermission('manage_users')]
 */
const requirePermission = (key) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.adminRole) {
        return res.status(403).json({ success: false, message: 'No role assigned — contact a Super Administrator.' });
      }
      const Role = require('../models/roleModel');
      const role = await Role.findById(req.user.adminRole).lean();
      if (!role) {
        return res.status(403).json({ success: false, message: 'Assigned role not found.' });
      }
      if (role.permissions.includes('all') || role.permissions.includes(key)) {
        return next();
      }
      return res.status(403).json({ success: false, message: `Missing permission: ${key}` });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
};

module.exports = { protect, authorize, optionalProtect, requirePermission };
