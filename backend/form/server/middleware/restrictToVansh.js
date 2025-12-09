export const restrictToVansh = (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') return next();
    if (!req.user.managedVansh) return next();

    req.vanshFilter = req.vanshFilter || {};
    const vanshValue = parseInt(req.user.managedVansh, 10);
    if (!isNaN(vanshValue)) {
      req.vanshFilter = { ...req.vanshFilter, 'personalDetails.vansh': vanshValue };
    } else {
      req.vanshFilter = { ...req.vanshFilter, 'personalDetails.vansh': new RegExp(`^${req.user.managedVansh}$`, 'i') };
    }
    next();
  } catch (error) {
    console.error('Error restricting request to vansh:', error);
    next(error);
  }
};
