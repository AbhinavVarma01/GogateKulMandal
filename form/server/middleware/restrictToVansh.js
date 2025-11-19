export const restrictToVansh = (req, res, next) => {
  if (req.user?.role !== 'admin') return next();
  if (!req.user.managedVansh) return next();
  
  const vanshValue = parseInt(req.user.managedVansh, 10);
  if (!isNaN(vanshValue)) {
    req.vanshFilter = { 'personalDetails.vansh': vanshValue };
  } else {
    req.vanshFilter = { 'personalDetails.vansh': new RegExp(`^${req.user.managedVansh}$`, 'i') };
  }
  next();
};
