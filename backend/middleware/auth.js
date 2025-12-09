import jwt from 'jsonwebtoken';

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Middleware to check if user has DBA role
export const requireDBA = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'dba') {
      return res.status(403).json({ message: 'Access denied. DBA role required.' });
    }
    next();
  } catch (error) {
    console.error('Error in requireDBA middleware:', error);
    res.status(500).json({ message: 'Failed to evaluate DBA access' });
  }
};

// Middleware to check if user has admin role
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'master_admin')) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    next();
  } catch (error) {
    console.error('Error in requireAdmin middleware:', error);
    res.status(500).json({ message: 'Failed to evaluate admin access' });
  }
};

// Middleware to check if user has admin or DBA role
export const requireAdminOrDBA = (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'dba' && req.user.role !== 'admin' && req.user.role !== 'master_admin')) {
      return res.status(403).json({ message: 'Access denied. Admin or DBA role required.' });
    }
    next();
  } catch (error) {
    console.error('Error in requireAdminOrDBA middleware:', error);
    res.status(500).json({ message: 'Failed to evaluate admin/DBA access' });
  }
};

// Middleware to verify admin has access to a specific vansh
export const requireVanshAccess = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Access denied. Authentication required.' });
    }

    if (req.user.role === 'dba' || req.user.role === 'master_admin') {
      return next();
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    if (!req.user.managedVansh) {
      return res.status(403).json({ message: 'Access denied. No vansh assigned to admin.' });
    }
    
    next();
  } catch (error) {
    console.error('Error in requireVanshAccess middleware:', error);
    res.status(500).json({ message: 'Failed to evaluate vansh access' });
  }
};

// Middleware to verify data belongs to admin's vansh
export const verifyVanshOwnership = (getVanshFromData) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(403).json({ message: 'Access denied. Authentication required.' });
      }

      if (req.user.role === 'dba' || req.user.role === 'master_admin') {
        return next();
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
      }
      
      if (!req.user.managedVansh) {
        return res.status(403).json({ message: 'Access denied. No vansh assigned to admin.' });
      }
      
      const dataVansh = getVanshFromData(req);
      const adminVansh = req.user.managedVansh;
      
      if (String(dataVansh) !== String(adminVansh)) {
        return res.status(403).json({ message: 'Access denied. This data belongs to a different vansh.' });
      }
      
      next();
    } catch (error) {
      console.error('Error in verifyVanshOwnership middleware:', error);
      res.status(500).json({ message: 'Failed to verify vansh ownership' });
    }
  };
};
