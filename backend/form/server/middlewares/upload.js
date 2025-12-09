import multer from "multer";

const fileFilter = (_req, file, cb) => {
  try {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  } catch (error) {
    cb(error);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
  },
});

const normalizeFieldValue = (value) => {
  if (value === "null" || value === "undefined") {
    return null;
  }
  return value;
};

const parseNestedFields = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      const newBody = {};
      
      // First, copy all non-nested fields
      Object.entries(req.body).forEach(([key, value]) => {
        if (!key.includes(".")) {
          newBody[key] = normalizeFieldValue(value);
        }
      });
      
      // Then process nested fields
      Object.entries(req.body).forEach(([key, value]) => {
        if (key.includes(".")) {
          const keys = key.split(".");
          let current = newBody;
          
          for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            // Ensure we only create objects, not overwrite with primitives
            if (!current[k] || typeof current[k] !== "object" || Array.isArray(current[k])) {
              current[k] = {};
            }
            current = current[k];
          }
          
          // Assign the value to the final key
          const finalKey = keys[keys.length - 1];
          current[finalKey] = normalizeFieldValue(value);
        }
      });
      
      req.body = newBody;
    }
    next();
  } catch (error) {
    console.error("Error parsing nested form fields:", error);
    next(error);
  }
};

export { upload, parseNestedFields };
