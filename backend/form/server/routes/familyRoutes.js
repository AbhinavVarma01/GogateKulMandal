import express from "express";
import { addFamilyMember, getAllFamilyMembers, getAllRegistrations, getRegistrationById, getRejectedMembers, clearRejectedMembers, updateRegistrationStatus, searchParents, getMemberById, updateMember, deleteMember } from "../controllers/familyController.js";
import { upload, parseNestedFields } from "../middlewares/upload.js";
import { sendTestEmail } from "../utils/emailService.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { restrictToVansh } from "../middleware/restrictToVansh.js";

const router = express.Router();

const uploadFields = upload.fields([
  { name: "personalDetails.profileImage", maxCount: 1 },
  { name: "divorcedDetails.spouseProfileImage", maxCount: 1 },
  { name: "marriedDetails.spouseProfileImage", maxCount: 1 },
  { name: "remarriedDetails.spouseProfileImage", maxCount: 1 },
  { name: "widowedDetails.spouseProfileImage", maxCount: 1 },
  { name: "parentsInformation.fatherProfileImage", maxCount: 1 },
  { name: "parentsInformation.motherProfileImage", maxCount: 1 },
]);

// Log all POST requests to /add
router.post("/add", (req, res, next) => {
  console.log("📥 POST /api/family/add - Request received");
  next();
}, uploadFields, parseNestedFields, addFamilyMember);

router.get("/all", verifyToken, restrictToVansh, getAllFamilyMembers);
router.get("/registrations", verifyToken, restrictToVansh, getAllRegistrations);
router.get("/registrations/:id", getRegistrationById); // Get single registration with images
router.get("/rejected", verifyToken, restrictToVansh, getRejectedMembers);
router.delete("/rejected", verifyToken, restrictToVansh, clearRejectedMembers);
router.patch("/registrations/:id/status", updateRegistrationStatus);
router.get("/search", searchParents);

// CRUD operations for admin to manage approved members
router.get("/members/:id", getMemberById);
router.put("/members/:id", updateMember);
router.delete("/members/:id", deleteMember);

// Test email endpoint
router.post("/test-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email address is required" });
    }
    await sendTestEmail(email);
    return res.status(200).json({ success: true, message: "Test email sent successfully!" });
  } catch (error) {
    console.error("Error sending test email:", error);
    return res.status(500).json({ success: false, message: "Failed to send test email", error: error.message });
  }
});

// Debug endpoint to check members collection
router.get("/debug/members", async (req, res) => {
  try {
    const db = require('mongoose').connection.db;
    const members = await db.collection('members').find().toArray();
    return res.status(200).json({ 
      success: true, 
      count: members.length,
      data: members.map(m => ({
        _id: m._id,
        firstName: m.personalDetails?.firstName,
        username: m.username,
        isapproved: m.isapproved,
        _sheetRowKey: m._sheetRowKey
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;