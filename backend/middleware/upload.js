import multer from 'multer';

// Store files in memory for processing
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  try {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  } catch (error) {
    cb(error, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware to parse nested form fields from multer
export const parseNestedFields = (req, res, next) => {
  try {
    if (!req.files) {
      return next();
    }

    // Multer may set req.files as an array (upload.any()) or as an object (upload.fields()).
    // Normalize array -> object mapping by fieldname so subsequent logic can treat
    // both formats uniformly.
    let filesByField = {};

    if (Array.isArray(req.files)) {
      req.files.forEach((file) => {
        filesByField[file.fieldname] = filesByField[file.fieldname] || [];
        filesByField[file.fieldname].push(file);
      });
    } else {
      // already an object mapping fieldName -> files
      filesByField = { ...req.files };
    }

    const nested = {};
    Object.keys(filesByField).forEach((fieldName) => {
      const value = filesByField[fieldName];
      const parts = fieldName.split('.');

      let current = nested;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = value;
    });

    req.files = nested;
    next();
  } catch (error) {
    console.error('Error parsing nested upload fields:', error);
    next(error);
  }
};
