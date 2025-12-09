import FamilyMember from "../models/FamilyMember.js";
import Members from "../models/Members.js";
import mongoose from "mongoose";
import { generateUsername, generateRandomPassword, sendApprovalEmail } from "../utils/emailService.js";

const DATA_URI_REGEX = /^data:(.+?);base64,(.+)$/;

const convertDataUriToImageObject = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  const match = normalizedValue.match(DATA_URI_REGEX);

  if (!match) {
    return null;
  }

  const [, mimeType, base64Data] = match;

  if (!mimeType || !base64Data) {
    return null;
  }

  return {
    mimeType,
    data: base64Data,
    originalName: "data-uri-upload",
  };
};

const normalizeImageDataUris = (input) => {
  if (Array.isArray(input)) {
    return input.map((item) => normalizeImageDataUris(item));
  }

  if (input && typeof input === "object") {
    return Object.entries(input).reduce((acc, [key, value]) => {
      acc[key] = normalizeImageDataUris(value);
      return acc;
    }, {});
  }

  if (typeof input === "string") {
    const imageObject = convertDataUriToImageObject(input);
    return imageObject || input;
  }

  return input;
};

export const addFamilyMember = async (req, res) => {
  try {
    console.log('🔍 Mongoose connection state:', mongoose.connection.readyState);
    console.log('🔍 Mongoose database:', mongoose.connection.db?.databaseName);
    
    // Convert uploaded files to base64
    const filesData = {};
    Object.entries(req.files || {}).forEach(([fieldPath, files]) => {
      const parsed = fieldPath.split(".");
      const property = parsed.pop();
      const parentPath = parsed.join(".");

      filesData[parentPath] = filesData[parentPath] || {};
      if (files && files.length > 0) {
        const file = files[0];
        filesData[parentPath][property] = {
          data: file.buffer.toString("base64"),
          mimeType: file.mimetype,
          originalName: file.originalname,
        };
      }
    });

    const mergeData = (base, updates) => {
      const result = Array.isArray(base) ? [...base] : { ...base };
      Object.keys(updates).forEach((key) => {
        if (updates[key] && typeof updates[key] === "object" && !Array.isArray(updates[key])) {
          const existingValue = base?.[key] && typeof base[key] === "object" ? base[key] : {};
          result[key] = mergeData(existingValue, updates[key]);
        } else {
          result[key] = updates[key];
        }
      });
      return result;
    };

    let payload = req.body;

    if (req.files) {
      payload = Object.keys(filesData).reduce((acc, key) => {
        const keys = key.split(".");
        let pointer = acc;
        keys.forEach((k, index) => {
          if (index === keys.length - 1) {
            pointer[k] = mergeData(pointer[k], filesData[key]);
          } else {
            pointer[k] = pointer[k] || {};
            pointer = pointer[k];
          }
        });
        return acc;
      }, payload);
    }

    payload = normalizeImageDataUris(payload);

    const cleanPayload = (data) => {
      if (Array.isArray(data)) {
        const cleanedArray = data
          .map((item) => cleanPayload(item))
          .filter((item) => item !== undefined);
        return cleanedArray.length ? cleanedArray : undefined;
      }

      if (data && typeof data === "object") {
        const cleanedObject = Object.entries(data).reduce((acc, [key, value]) => {
          const cleanedValue = cleanPayload(value);
          const isEmptyObject =
            cleanedValue &&
            typeof cleanedValue === "object" &&
            !Array.isArray(cleanedValue) &&
            Object.keys(cleanedValue).length === 0;

          if (
            cleanedValue !== undefined &&
            cleanedValue !== "" &&
            !isEmptyObject
          ) {
            acc[key] = cleanedValue;
          }

          return acc;
        }, {});

        return Object.keys(cleanedObject).length ? cleanedObject : undefined;
      }

      if (data === null || data === "null" || data === "undefined") {
        return undefined;
      }

      return data;
    };

    const cleanedPayload = cleanPayload(payload) || {};

    const familyMember = await FamilyMember.create(cleanedPayload);

    return res.status(201).json({ 
      success: true, 
      data: familyMember, 
      message: "✅ Family member saved successfully to database!",
      documentId: familyMember._id
    });
  } catch (error) {
    console.error("❌ Error saving family member:", error.message);
    console.error("❌ Full error:", error);
    console.error("❌ Error stack:", error.stack);
    
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Fill all the important credentials before submitting the form.",
        error: error.message
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: `❌ Error: ${error.message}`,
      error: error.message 
    });
  }
};

export const getAllFamilyMembers = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Default to 1000 for backwards compatibility
    const skip = (page - 1) * limit;
    
    // Get search term if provided
    const search = req.query.search || '';
    
    // Get vansh filter from JWT or query params
    const vansh = req.user?.managedVansh || req.query.vansh;
    
    // Build search filter
    let searchFilter = { ...req.vanshFilter };
    if (search) {
      searchFilter = {
        ...searchFilter,
        $or: [
          { 'personalDetails.firstName': { $regex: search, $options: 'i' } },
          { 'personalDetails.middleName': { $regex: search, $options: 'i' } },
          { 'personalDetails.lastName': { $regex: search, $options: 'i' } },
          { 'personalDetails.email': { $regex: search, $options: 'i' } },
          { 'personalDetails.mobileNumber': { $regex: search, $options: 'i' } },
          { 'personalDetails.vansh': { $regex: search, $options: 'i' } },
          { serNo: isNaN(search) ? -1 : parseInt(search) }
        ]
      };
    }
    
    // Add vansh filter if provided and not already set from middleware
    if (vansh && !searchFilter['personalDetails.vansh']) {
      const vanshValue = parseInt(vansh, 10);
      if (!isNaN(vanshValue)) {
        searchFilter['personalDetails.vansh'] = vanshValue;
      } else {
        searchFilter['personalDetails.vansh'] = { $regex: new RegExp(`^${vansh}$`, 'i') };
      }
    }
    
    // Get total count for pagination
    const totalCount = await db.collection('members').countDocuments(searchFilter);
    
    // Exclude base64 image fields for faster loading
    const members = await db.collection('members')
      .find(
        searchFilter,
        {
          projection: {
            'personalDetails.profileImage': 0,
            'parentsInformation.fatherProfileImage': 0,
            'parentsInformation.motherProfileImage': 0,
            'marriedDetails.spouseProfileImage': 0,
            'divorcedDetails.spouseProfileImage': 0,
            'remarriedDetails.spouseProfileImage': 0,
            'widowedDetails.spouseProfileImage': 0
          }
        }
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return res.status(200).json({ 
      success: true, 
      data: members,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("❌ Error fetching family members:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllRegistrations = async (req, res) => {
  try {
    let filter = { ...req.vanshFilter };
    
    if (!filter['personalDetails.vansh']) {
      const vansh = req.query.vansh;
      if (vansh) {
        const vanshValue = parseInt(vansh, 10);
        if (!isNaN(vanshValue)) {
          filter['personalDetails.vansh'] = vanshValue;
        } else {
          filter['personalDetails.vansh'] = { $regex: new RegExp(`^${vansh}$`, 'i') };
        }
      }
    }
    
    const registrations = await FamilyMember.find(filter)
      .select('-personalDetails.profileImage -parentsInformation.fatherProfileImage -parentsInformation.motherProfileImage -marriedDetails.spouseProfileImage -divorcedDetails.spouseProfileImage -remarriedDetails.spouseProfileImage -widowedDetails.spouseProfileImage')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: registrations });
  } catch (error) {
    console.error("❌ Error fetching registrations:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getRejectedMembers = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    let filter = { ...req.vanshFilter };
    
    if (!filter['personalDetails.vansh']) {
      const vansh = req.query.vansh;
      if (vansh) {
        const vanshValue = parseInt(vansh, 10);
        if (!isNaN(vanshValue)) {
          filter['personalDetails.vansh'] = vanshValue;
        } else {
          filter['personalDetails.vansh'] = { $regex: new RegExp(`^${vansh}$`, 'i') };
        }
      }
    }
    
    console.log('📋 Fetching rejected members with filter:', JSON.stringify(filter));
    
    // Exclude base64 image fields for faster loading
    const rejectedMembers = await db.collection('rejectedMemb')
      .find(
        filter,
        {
          projection: {
            'personalDetails.profileImage': 0,
            'parentsInformation.fatherProfileImage': 0,
            'parentsInformation.motherProfileImage': 0,
            'marriedDetails.spouseProfileImage': 0,
            'divorcedDetails.spouseProfileImage': 0,
            'remarriedDetails.spouseProfileImage': 0,
            'widowedDetails.spouseProfileImage': 0
          }
        }
      )
      .sort({ rejectedAt: -1 })
      .toArray();
    
    console.log(`✅ Found ${rejectedMembers.length} rejected members`);
    return res.status(200).json({ success: true, data: rejectedMembers });
  } catch (error) {
    console.error("❌ Error fetching rejected members:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Clear all rejected members from rejectedMemb collection
export const clearRejectedMembers = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    let filter = { ...req.vanshFilter };
    
    if (!filter['personalDetails.vansh']) {
      const vansh = req.query.vansh;
      if (vansh) {
        const vanshValue = parseInt(vansh, 10);
        if (!isNaN(vanshValue)) {
          filter['personalDetails.vansh'] = vanshValue;
        } else {
          filter['personalDetails.vansh'] = { $regex: new RegExp(`^${vansh}$`, 'i') };
        }
      }
    }
    
    // Delete all rejected members matching the filter
    const result = await db.collection('rejectedMemb').deleteMany(filter);
    
    console.log(`🗑️ Cleared ${result.deletedCount} rejected members`);
    return res.status(200).json({ 
      success: true, 
      message: `Successfully cleared ${result.deletedCount} rejected member(s)`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error("❌ Error clearing rejected members:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get single registration by ID (with images)
export const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await FamilyMember.findById(id);
    
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }
    
    return res.status(200).json({ success: true, data: registration });
  } catch (error) {
    console.error("❌ Error fetching registration:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    // Find the registration in Heirarchy_form
    const registration = await FamilyMember.findById(id);

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    if (status === 'approved') {
      // Move to members collection
      const memberData = registration.toObject();
      
      delete memberData._id;
      delete memberData.status;
      delete memberData.adminNotes;
      delete memberData.reviewedAt;
      delete memberData._sheetRowKey;
      delete memberData.__v;
      
      // Remove any null/undefined fields
      Object.keys(memberData).forEach(key => {
        if (memberData[key] === null || memberData[key] === undefined) {
          delete memberData[key];
        }
      });
      
      // Generate auto-incrementing serNo
      const db = mongoose.connection.db;
      const lastMember = await db.collection('members')
        .find({})
        .sort({ serNo: -1 })
        .limit(1)
        .toArray();
      
      const nextSerNo = lastMember.length > 0 && lastMember[0].serNo 
        ? lastMember[0].serNo + 1 
        : 1;
      
      memberData.serNo = nextSerNo;
      
      // Auto-link parents in family tree - CREATE parents if they don't exist
      if (memberData.parentsInformation) {
        const parentsCollection = db.collection('members');
        
        // Handle Father
        if (memberData.parentsInformation.fatherFirstName && memberData.parentsInformation.fatherLastName) {
          const fatherQuery = {
            $or: [
              {
                'personalDetails.firstName': memberData.parentsInformation.fatherFirstName,
                'personalDetails.lastName': memberData.parentsInformation.fatherLastName
              },
              {
                firstName: memberData.parentsInformation.fatherFirstName,
                lastName: memberData.parentsInformation.fatherLastName
              }
            ]
          };
          
          let father = await parentsCollection.findOne(fatherQuery);
          
          if (father && father.serNo) {
            // Father exists, link him
            memberData.parentsInformation.fatherSerNo = father.serNo;
            memberData.fatherSerNo = father.serNo; // Also set at root level for family tree
            console.log(`✅ Linked father with existing serNo: ${father.serNo}`);
          } else {
            // Father doesn't exist, CREATE him
            const lastMemberForFather = await parentsCollection
              .find({})
              .sort({ serNo: -1 })
              .limit(1)
              .toArray();
            
            const fatherSerNo = lastMemberForFather.length > 0 && lastMemberForFather[0].serNo 
              ? lastMemberForFather[0].serNo + 1 
              : nextSerNo + 1;
            
            const fatherData = {
              serNo: fatherSerNo,
              personalDetails: {
                firstName: memberData.parentsInformation.fatherFirstName,
                middleName: memberData.parentsInformation.fatherMiddleName || '',
                lastName: memberData.parentsInformation.fatherLastName,
                gender: 'male',
                dateOfBirth: memberData.parentsInformation.fatherDateOfBirth || null,
                email: memberData.parentsInformation.fatherEmail || '',
                mobileNumber: memberData.parentsInformation.fatherMobileNumber || '',
                vansh: memberData.personalDetails.vansh
              },
              isapproved: true,
              _sheetRowKey: `auto_father_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date(),
              autoCreated: true // Mark as auto-created
            };
            
            // Add father's profile image if provided
            if (memberData.parentsInformation.fatherProfileImage) {
              fatherData.personalDetails.profileImage = memberData.parentsInformation.fatherProfileImage;
            }
            
            await parentsCollection.insertOne(fatherData);
            memberData.parentsInformation.fatherSerNo = fatherSerNo;
            memberData.fatherSerNo = fatherSerNo; // Also set at root level for family tree
            console.log(`✅ Created father with new serNo: ${fatherSerNo}`);
          }
        }
        
        // Handle Mother
        if (memberData.parentsInformation.motherFirstName && memberData.parentsInformation.motherLastName) {
          const motherQuery = {
            $or: [
              {
                'personalDetails.firstName': memberData.parentsInformation.motherFirstName,
                'personalDetails.lastName': memberData.parentsInformation.motherLastName
              },
              {
                firstName: memberData.parentsInformation.motherFirstName,
                lastName: memberData.parentsInformation.motherLastName
              }
            ]
          };
          
          let mother = await parentsCollection.findOne(motherQuery);
          
          if (mother && mother.serNo) {
            // Mother exists, link her
            memberData.parentsInformation.motherSerNo = mother.serNo;
            memberData.motherSerNo = mother.serNo; // Also set at root level for family tree
            console.log(`✅ Linked mother with existing serNo: ${mother.serNo}`);
          } else {
            // Mother doesn't exist, CREATE her
            const lastMemberForMother = await parentsCollection
              .find({})
              .sort({ serNo: -1 })
              .limit(1)
              .toArray();
            
            const motherSerNo = lastMemberForMother.length > 0 && lastMemberForMother[0].serNo 
              ? lastMemberForMother[0].serNo + 1 
              : nextSerNo + 1;
            
            const motherData = {
              serNo: motherSerNo,
              personalDetails: {
                firstName: memberData.parentsInformation.motherFirstName,
                middleName: memberData.parentsInformation.motherMiddleName || '',
                lastName: memberData.parentsInformation.motherLastName,
                gender: 'female',
                dateOfBirth: memberData.parentsInformation.motherDateOfBirth || null,
                email: '',
                mobileNumber: memberData.parentsInformation.motherMobileNumber || '',
                vansh: memberData.personalDetails.vansh
              },
              isapproved: true,
              _sheetRowKey: `auto_mother_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date(),
              autoCreated: true // Mark as auto-created
            };
            
            // Add mother's profile image if provided
            if (memberData.parentsInformation.motherProfileImage) {
              motherData.personalDetails.profileImage = memberData.parentsInformation.motherProfileImage;
            }
            
            await parentsCollection.insertOne(motherData);
            memberData.parentsInformation.motherSerNo = motherSerNo;
            memberData.motherSerNo = motherSerNo; // Also set at root level for family tree
            console.log(`✅ Created mother with new serNo: ${motherSerNo}`);
          }
        }
      }
      
      // Generate login credentials
      const username = generateUsername(memberData);
      const password = generateRandomPassword(10);
      
      // Add credentials to member data
      memberData.username = username;
      memberData.password = password;
      memberData.isapproved = true;
      
      // Set a unique _sheetRowKey
      memberData._sheetRowKey = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create member in database
      const result = await db.collection('members').insertOne(memberData);
      const newMember = { ...memberData, _id: result.insertedId };
      
      // Send approval email with credentials
      const email = memberData.personalDetails?.email;
      const firstName = memberData.personalDetails?.firstName || 'Member';
      const lastName = memberData.personalDetails?.lastName || '';
      
      // Validate email before sending
      const isValidEmail = (email) => {
        if (!email || typeof email !== 'string') return false;
        
        // Basic email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return false;
        
        // Check if it's a real email (not placeholder)
        const invalidPatterns = [
          '@gmail.com', // Generic gmail without proper name
          '@example.com',
          '@test.com',
          '@dummy.com',
          'noemail',
          'test@',
          'dummy@'
        ];
        
        const emailLower = email.toLowerCase();
        
        // If email is exactly one of the invalid patterns or very short
        if (emailLower.length < 6) return false;
        
        // Check for specific dummy emails
        if (emailLower.includes('noemail') || 
            emailLower.includes('test@test') || 
            emailLower.includes('dummy@dummy') ||
            emailLower === 'test@gmail.com' ||
            emailLower === 'user@gmail.com') {
          return false;
        }
        
        return true;
      };
      
      if (email && isValidEmail(email)) {
        try {
          await sendApprovalEmail({
            email,
            firstName,
            lastName,
            username,
            password
          });
          console.log(`✅ Email sent to ${email}`);
        } catch (emailError) {
          console.error('❌ Email failed:', emailError.message);
        }
      }
      
      // Delete from Heirarchy_form
      await FamilyMember.findByIdAndDelete(id);
      
      return res.status(200).json({ 
        success: true, 
        message: "Registration approved and moved to members collection. Email sent with credentials.",
        data: { 
          id: newMember._id, 
          status: 'approved',
          username,
          emailSent: !!email
        }
      });

    } else if (status === 'rejected') {
      console.log(`📦 Moving registration ${id} to rejectedMemb collection`);
      
      // Get the raw document data
      const rejectedData = registration.toObject();
      rejectedData.adminNotes = adminNotes || '';
      rejectedData.rejectedAt = new Date();
      rejectedData.status = 'rejected'; // Ensure status is set
      delete rejectedData._id; // Remove _id to let MongoDB generate a new one
      
      // Insert directly into rejectedMemb collection without validation
      const db = mongoose.connection.db;
      const result = await db.collection('rejectedMemb').insertOne(rejectedData);
      
      console.log(`✅ Inserted into rejectedMemb with new _id: ${result.insertedId}`);
      
      // Delete from Heirarchy_form
      await FamilyMember.findByIdAndDelete(id);
      
      console.log(`✅ Registration rejected and moved to rejectedMemb collection`);
      return res.status(200).json({ 
        success: true, 
        message: "Registration rejected and moved to rejectedMemb collection",
        data: { id: result.insertedId, status: 'rejected' }
      });

    } else {
      // Just update status for other cases (under_review, pending, etc.)
      const updatedRegistration = await FamilyMember.findByIdAndUpdate(
        id,
        { 
          status,
          adminNotes,
          reviewedAt: new Date()
        },
        { new: true }
      );

      console.log(`📊 Updated registration ${id} status to ${status}`);
      return res.status(200).json({ success: true, data: updatedRegistration });
    }

  } catch (error) {
    console.error("❌ Error updating registration:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const searchParents = async (req, res) => {
  try {
    const { query, vansh } = req.query;

    console.log("🔍 Parent Search - Query:", query, "Vansh:", vansh);

    if (!query || query.trim().length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    if (!vansh) {
      return res.status(200).json({ success: true, data: [], message: "Vansh is required to search for parents" });
    }

    // Reduce DB load: avoid count/findOne on every request and use a query
    // that can leverage an index on `vansh` while applying regex on name
    // fields for the filtered set. This reduces full-collection scans.
  // Anchor regex to start to enable prefix index usage (faster for autocomplete)
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const searchRegex = new RegExp(`^${escapeRegExp(query)}`, "i");

    const members = await Members.find({
      vansh: String(vansh),
      $or: [
        { "personalDetails.firstName": { $regex: searchRegex } },
        { "personalDetails.middleName": { $regex: searchRegex } },
        { "personalDetails.lastName": { $regex: searchRegex } },
      ],
    })
      .select("serNo personalDetails vansh")
      .limit(10);

    console.log(`✅ Found ${members.length} matching members for vansh: ${vansh}`);

    const formattedMembers = members.map((member) => ({
      id: member._id,
      serNo: member.serNo || null,
      firstName: member.personalDetails?.firstName || "",
      middleName: member.personalDetails?.middleName || "",
      lastName: member.personalDetails?.lastName || "",
      dateOfBirth: member.personalDetails?.dateOfBirth 
        ? new Date(member.personalDetails.dateOfBirth).toISOString().split("T")[0] 
        : "",
      profileImage: member.personalDetails?.profileImage || null,
      gender: member.personalDetails?.gender || "",
      email: member.personalDetails?.email || "",
      mobileNumber: member.personalDetails?.mobileNumber || "",
      vansh: member.vansh || "",
      displayName: `${member.personalDetails?.firstName || ""} ${member.personalDetails?.middleName || ""} ${
        member.personalDetails?.lastName || ""
      }`.trim(),
    }));

    return res.status(200).json({ success: true, data: formattedMembers });
  } catch (error) {
    console.error("❌ Error searching parents:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// CRUD Operations for Admin to manage approved members

// Get a single member by ID
export const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = mongoose.connection.db;
    const member = await db.collection('members').findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    return res.status(200).json({ success: true, data: member });
  } catch (error) {
    console.error("❌ Error fetching member:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// Update a member by ID
export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`📝 Updating member ${id}`);
    
    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    
    // If serNo is being changed, check if it's unique
    if (updateData.serNo) {
      const db = mongoose.connection.db;
      const existingMember = await db.collection('members').findOne({ 
        serNo: updateData.serNo,
        _id: { $ne: new mongoose.Types.ObjectId(id) }
      });
      
      if (existingMember) {
        return res.status(400).json({ 
          success: false, 
          message: `SerNo ${updateData.serNo} is already assigned to another member` 
        });
      }
    }
    
    // Convert nested objects to dot notation to avoid overwriting entire objects
    const flattenedUpdate = {};
    
    Object.keys(updateData).forEach(key => {
      if (key === 'personalDetails' && typeof updateData[key] === 'object') {
        // Flatten personalDetails
        Object.keys(updateData[key]).forEach(nestedKey => {
          const value = updateData[key][nestedKey];
          // Only include non-empty values or explicitly false/0 values
          if (value !== '' && value !== null && value !== undefined) {
            flattenedUpdate[`personalDetails.${nestedKey}`] = value;
          }
        });
      } else if (key === 'parentsInformation' && typeof updateData[key] === 'object') {
        // Flatten parentsInformation
        Object.keys(updateData[key]).forEach(nestedKey => {
          const value = updateData[key][nestedKey];
          if (value !== '' && value !== null && value !== undefined) {
            flattenedUpdate[`parentsInformation.${nestedKey}`] = value;
          }
        });
      } else if (key === 'marriedDetails' && typeof updateData[key] === 'object') {
        // Flatten marriedDetails
        Object.keys(updateData[key]).forEach(nestedKey => {
          const value = updateData[key][nestedKey];
          if (value !== '' && value !== null && value !== undefined) {
            flattenedUpdate[`marriedDetails.${nestedKey}`] = value;
          }
        });
      } else {
        // Root level fields
        flattenedUpdate[key] = updateData[key];
      }
    });
    
    flattenedUpdate.updatedAt = new Date();
    
    const db = mongoose.connection.db;
    const result = await db.collection('members').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: flattenedUpdate },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    console.log(`✅ Member ${id} updated successfully`);
    return res.status(200).json({ 
      success: true, 
      message: "Member updated successfully",
      data: result.value 
    });
  } catch (error) {
    console.error("❌ Error updating member:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// Delete a member by ID
export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting member ${id}`);
    
    const db = mongoose.connection.db;
    const result = await db.collection('members').deleteOne({ 
      _id: new mongoose.Types.ObjectId(id) 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    console.log(`✅ Member ${id} deleted successfully`);
    return res.status(200).json({ 
      success: true, 
      message: "Member deleted successfully" 
    });
  } catch (error) {
    console.error("❌ Error deleting member:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
