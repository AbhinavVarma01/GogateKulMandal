import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import createAuthRouter from './routes/auth.js';
import newsRouter from './routes/news.js';
import eventsRouter from './routes/events.js';
import mediaRouter from './routes/media.js';
import fs from 'fs';
import { verifyToken, requireDBA, requireAdmin } from './middleware/auth.js';
import { upload, parseNestedFields } from './middleware/upload.js';
import { transformMemberForTree, transformMembersForTree, buildTreeStructure, getMembersByLevel } from './utils/memberTransform.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for Base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global error handler for JSON parsing errors
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('JSON parsing error:', error.message);
    return res.status(400).json({ message: 'Invalid JSON format' });
  }
  next();
});

const mongoUri = 'mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'test';
const collectionName = 'members';
const newsCollectionName = 'news';
const eventsCollectionName = 'events';
const sheetsCollectionName = 'members';

let client;
let db;

async function connectToMongo() {
  if (db) return db;
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(dbName);
    try {
      // Ensure unique index for dedupe on GogteKulamandalFamily
      await db.collection(collectionName).createIndex({ _sheetRowKey: 1 }, { unique: true, name: 'uniq_sheet_row_key' });
    } catch (e) {
      // ignore index errors if already exists
    }
    return db;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

// Utility: convert flat objects with dot-notation keys into nested objects
// Example: { 'personalDetails.firstName': 'Abhinav', 'parentsInformation.fatherFirstName': 'Umesh' }
// becomes { personalDetails: { firstName: 'Abhinav' }, parentsInformation: { fatherFirstName: 'Umesh' } }
function nestObject(flatObj) {
  if (!flatObj || typeof flatObj !== 'object') return flatObj;
  const nested = {};

  // First, copy non-dot keys shallowly (they may be objects already)
  Object.keys(flatObj).forEach((key) => {
    if (!key.includes('.')) {
      // If the value is an object, clone it to avoid mutation of original
      nested[key] = flatObj[key] && typeof flatObj[key] === 'object' && !Array.isArray(flatObj[key])
        ? { ...flatObj[key] }
        : flatObj[key];
    }
  });

  // Then process dotted keys and merge into nested structure
  Object.keys(flatObj).forEach((key) => {
    if (!key.includes('.')) return;
    const parts = key.split('.');
    let cursor = nested;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      if (isLast) {
        // Assign value, overwriting only if necessary
        cursor[part] = flatObj[key];
      } else {
        if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
          cursor[part] = {};
        }
        cursor = cursor[part];
      }
    }
  });

  return nested;
}

const buildAdminVanshFilter = (rawVansh) => {
  if (rawVansh === undefined || rawVansh === null) {
    return {};
  }
  const normalized = `${rawVansh}`.trim();
  if (!normalized) {
    return {};
  }
  const numeric = Number(normalized);
  const values = new Set([normalized]);
  if (!Number.isNaN(numeric)) {
    values.add(numeric);
    values.add(numeric.toString());
  }
  const fields = [
    'vansh',
    'Vansh',
    'VanshNo',
    'vanshNo',
    'personalDetails.vansh',
    'personalDetails.Vansh',
    'personalDetails.vanshNo',
    'personalDetails.VanshNo'
  ];
  const conditions = [];
  fields.forEach((field) => {
    values.forEach((value) => {
      conditions.push({ [field]: value });
    });
  });
  return conditions.length ? { $or: conditions } : {};
};

const getAdminVanshFilterFromRequest = (req) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return { filter: null, requireAssignment: false };
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    if (decoded.role === 'admin') {
      // Prefer managed vansh from token; fall back to query param if provided
      const normalized = decoded.managedVansh === undefined || decoded.managedVansh === null ? '' : `${decoded.managedVansh}`.trim();
      const queryVansh = req.query?.vansh === undefined || req.query?.vansh === null ? '' : `${req.query.vansh}`.trim();
      const vanshValue = normalized || queryVansh;
      if (!vanshValue) {
        // No vansh assignment and none provided; keep behavior requiring assignment
        return { filter: null, requireAssignment: true };
      }
      const filter = buildAdminVanshFilter(vanshValue);
      return { filter, requireAssignment: false };
    }
    return { filter: null, requireAssignment: false };
  } catch (err) {
    return { filter: null, requireAssignment: false };
  }
};

// Initialize mongoose (used for the optional example route using Model.save())
try {
  mongoose.connect(mongoUri, { dbName, autoIndex: false });
  // Create a permissive schema so we can save arbitrary member shapes
  const memberSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
  // Use the same collectionName so saved docs are in the same place as inserts
  mongoose.models.Member || mongoose.model('Member', memberSchema, collectionName);
} catch (e) {
  console.warn('Mongoose init warning:', e && e.message ? e.message : e);
}





app.get('/api/family/members', async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    const filters = [];

    if (req.query.level !== undefined) {
      const level = parseInt(req.query.level, 10);
      if (!Number.isNaN(level)) {
        filters.push({ level });
      }
    }

    const { filter: adminFilter, requireAssignment } = getAdminVanshFilterFromRequest(req);
    if (requireAssignment) {
      return res.status(403).json({ error: 'Admin account has no vansh assignment' });
    }
    if (adminFilter && Object.keys(adminFilter).length) {
      filters.push(adminFilter);
    }

    let query = {};
    if (filters.length === 1) {
      query = filters[0];
    } else if (filters.length > 1) {
      query = { $and: filters };
    }

    const members = await collection.find(query).toArray();
    console.log(`[family] db=${dbName} coll=${collectionName} query=${JSON.stringify(query)} count=${members.length}`);
    res.json({ members });
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Get total count of members (fast endpoint for dashboard)
app.get('/api/family/members/count', async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    const { vansh } = req.query;
    let filter = {};
    if (vansh !== undefined && vansh !== null) {
      const trimmed = String(vansh).trim();
      if (trimmed !== '') {
        const numeric = Number(trimmed);
        const conditions = [
          { vansh: trimmed },
          { 'personalDetails.vansh': trimmed },
          { 'personalDetails.Vansh': trimmed }
        ];
        if (!Number.isNaN(numeric)) {
          const numericString = numeric.toString();
          conditions.push(
            { vansh: numeric },
            { vansh: numericString },
            { 'personalDetails.vansh': numeric },
            { 'personalDetails.vansh': numericString },
            { 'personalDetails.Vansh': numeric },
            { 'personalDetails.Vansh': numericString }
          );
        }
        filter = { $or: conditions };
      }
    }
    const count = await collection.countDocuments(filter);
    res.json({ count });
  } catch (err) {
    console.error('Error counting members:', err);
    res.status(500).json({ error: 'Failed to count members' });
  }
});

// Fetch members by multiple serial numbers (for children)
app.post('/api/family/members/by-sernos', async (req, res) => {
  try {
    const { serNos } = req.body;
    if (!Array.isArray(serNos) || serNos.length === 0) {
      return res.json({ members: [] });
    }

    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    // Convert serNos to appropriate types (number or string)
    const normalizedSerNos = serNos.map(sn => {
      const num = Number(sn);
      return Number.isNaN(num) ? String(sn) : num;
    });
    
    const query = {
      $or: [
        { serNo: { $in: serNos } },
        { serNo: { $in: normalizedSerNos } }
      ]
    };
    
    const members = await collection.find(query).toArray();
    console.log(`[family] Fetched ${members.length} members by serNos:`, serNos);
    res.json({ members });
  } catch (err) {
    console.error('Error fetching members by serNos:', err);
    res.status(500).json({ error: 'Failed to fetch members by serial numbers' });
  }
});

// Fetch a single member by serial number (for spouse)
app.get('/api/family/members/by-serno/:serNo', async (req, res) => {
  try {
    const { serNo } = req.params;
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    // Try both number and string versions
    const num = Number(serNo);
    const searchValues = Number.isNaN(num) ? [String(serNo)] : [num, String(serNo)];
    
    const query = {
      serNo: { $in: searchValues }
    };
    
    const member = await collection.findOne(query);
    console.log(`[family] Fetched member by serNo ${serNo}:`, member ? 'found' : 'not found');
    res.json({ member });
  } catch (err) {
    console.error('Error fetching member by serNo:', err);
    res.status(500).json({ error: 'Failed to fetch member by serial number' });
  }
});

// Fetch a single member by MongoDB ID (for admin edit form)
app.get('/api/family/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    // Try to find member by ObjectId first, then by string ID
    let member;
    try {
      const ObjectId = (await import('mongodb')).ObjectId;
      member = await collection.findOne({ _id: new ObjectId(id) });
    } catch (objectIdError) {
      console.log('ObjectId conversion failed, trying string match:', objectIdError.message);
      member = await collection.findOne({ _id: id });
    }
    
    if (!member) {
      return res.status(404).json({ success: false, error: 'Family member not found' });
    }
    
    res.json({ success: true, data: member });
  } catch (err) {
    console.error('Error fetching member by ID:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch family member' });
  }
});

// New endpoint for visual family tree - returns all members
app.get('/api/family/members-new', async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    const members = await collection.find({}).toArray();
    console.log(`[family] Fetched all members for visual tree: ${members.length}`);
    res.json(members);
  } catch (err) {
    console.error('Error fetching all members:', err);
    res.status(500).json({ error: 'Failed to fetch all members' });
  }
});

// Search members for parent autocomplete
app.get('/api/family/search', async (req, res) => {
  try {
    const { query, vansh } = req.query;

    if (!query || !vansh) {
      return res.status(400).json({
        success: false,
        data: []
      });
    }

    const database = await connectToMongo();
    const collection = database.collection(collectionName);

    const searchRegex = new RegExp(query, 'i');
    const vanshNum = Number(vansh);

    const vanshConditions = Number.isNaN(vanshNum)
      ? [
          { vansh: vansh },
          { 'personalDetails.vansh': vansh }
        ]
      : [
          { vansh: vanshNum },
          { vansh: vansh.toString() },
          { 'personalDetails.vansh': vanshNum },
          { 'personalDetails.vansh': vansh.toString() }
        ];

    const members = await collection
      .find({
        $and: [
          {
            $or: [
              { 'personalDetails.firstName': searchRegex },
              { 'personalDetails.lastName': searchRegex },
              { 'personalDetails.middleName': searchRegex },
              { name: searchRegex },
              { firstName: searchRegex },
              { lastName: searchRegex },
              { middleName: searchRegex }
            ]
          },
          { $or: vanshConditions }
        ]
      })
      .limit(10)
      .toArray();

    const data = members.map((member) => {
      const personal = member.personalDetails || {};
      const profileImage = personal.profileImage || member.profileImage || null;
      const mobile = personal.mobileNumber || personal.alternateMobileNumber || member.mobileNumber || member.phoneNumber || '';
      const firstName = personal.firstName || member.firstName || '';
      const middleName = personal.middleName || member.middleName || '';
      const lastName = personal.lastName || member.lastName || '';
      const composedName = member.name || `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();

      return {
        serNo: member.serNo ?? personal.serNo ?? null,
        firstName,
        middleName,
        lastName,
        name: composedName,
        email: personal.email || member.email || '',
        mobileNumber: mobile,
        dateOfBirth: personal.dateOfBirth || member.dateOfBirth || '',
        profileImage
      };
    });

    console.log(`[family] Search query="${query}" vansh=${vansh} found=${data.length}`);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error searching members:', err);
    res.status(500).json({
      success: false,
      data: [],
      error: 'Failed to search members'
    });
  }
});

// Get all relationships (static relationships from database)
app.get('/api/family/all-relationships', async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    // Get all members and extract relationships
    const members = await collection.find({}).toArray();
    const relationships = [];
    
    members.forEach(member => {
      // Add spouse relationships
      if (member.spouseSerNo) {
        relationships.push({
          fromSerNo: member.serNo,
          toSerNo: member.spouseSerNo,
          relation: 'Spouse',
          relationMarathi: 'पती/पत्नी'
        });
      }
      
      // Add parent-child relationships
      if (member.sonDaughterSerNo && Array.isArray(member.sonDaughterSerNo)) {
        member.sonDaughterSerNo.forEach(childSerNo => {
          relationships.push({
            fromSerNo: member.serNo,
            toSerNo: childSerNo,
            relation: 'Child',
            relationMarathi: 'मुल/मुलगी'
          });
        });
      }
      
      // Add father relationship
      if (member.fatherSerNo) {
        relationships.push({
          fromSerNo: member.fatherSerNo,
          toSerNo: member.serNo,
          relation: 'Child',
          relationMarathi: 'मुल/मुलगी'
        });
      }
    });
    
    console.log(`[family] Generated ${relationships.length} static relationships`);
    res.json(relationships);
  } catch (err) {
    console.error('Error fetching relationships:', err);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

// Dynamic relations endpoint - calculates relationships dynamically
app.get('/api/family/dynamic-relations/:serNo', async (req, res) => {
  try {
    const { serNo } = req.params;
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    // Convert serNo to number
    const memberSerNo = parseInt(serNo);
    
    // Get the target member
    const targetMember = await collection.findOne({
      $or: [{ serNo: memberSerNo }, { serNo: String(memberSerNo) }]
    });
    
    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Get all members for relationship calculation
    const allMembers = await collection.find({}).toArray();
    
    // Calculate dynamic relationships
    const dynamicRelations = [];
    
    allMembers.forEach(member => {
      if (member.serNo === targetMember.serNo) return; // Skip self
      
      const relation = calculateRelationship(targetMember, member, allMembers);
      if (relation) {
        dynamicRelations.push({
          related: member,
          relationEnglish: relation.english,
          relationMarathi: relation.marathi,
          relationshipPath: relation.path || []
        });
      }
    });
    
    console.log(`[family] Calculated ${dynamicRelations.length} dynamic relations for serNo ${serNo}`);
    res.json(dynamicRelations);
  } catch (err) {
    console.error('Error calculating dynamic relations:', err);
    res.status(500).json({ error: 'Failed to calculate dynamic relations' });
  }
});

// Helper function to calculate relationship between two members
function calculateRelationship(person1, person2, allMembers) {
  // Create a map for quick lookup
  const memberMap = new Map();
  allMembers.forEach(member => {
    memberMap.set(member.serNo, member);
  });
  
  // Direct relationships
  
  // Spouse
  if (person1.spouseSerNo === person2.serNo || person2.spouseSerNo === person1.serNo) {
    return { english: 'Spouse', marathi: 'पती/पत्नी' };
  }
  
  // Parent-Child
  if (person1.fatherSerNo === person2.serNo) {
    return { english: 'Father', marathi: 'वडील' };
  }
  if (person2.fatherSerNo === person1.serNo) {
    return { english: 'Son/Daughter', marathi: 'मुल/मुलगी' };
  }
  
  // Children
  if (person1.sonDaughterSerNo && person1.sonDaughterSerNo.includes(person2.serNo)) {
    return { english: 'Son/Daughter', marathi: 'मुल/मुलगी' };
  }
  if (person2.sonDaughterSerNo && person2.sonDaughterSerNo.includes(person1.serNo)) {
    return { english: 'Father/Mother', marathi: 'वडील/आई' };
  }
  
  // Siblings (same father)
  if (person1.fatherSerNo && person2.fatherSerNo && person1.fatherSerNo === person2.fatherSerNo) {
    return { english: 'Sibling', marathi: 'भाऊ/बहीण' };
  }
  
  // Grandparent-Grandchild
  const person1Father = memberMap.get(person1.fatherSerNo);
  const person2Father = memberMap.get(person2.fatherSerNo);
  
  if (person1Father && person1Father.fatherSerNo === person2.serNo) {
    return { english: 'Grandfather', marathi: 'आजोबा' };
  }
  if (person2Father && person2Father.fatherSerNo === person1.serNo) {
    return { english: 'Grandson/Granddaughter', marathi: 'नातू/नात' };
  }
  
  // Uncle-Nephew/Niece
  if (person1Father && person2.fatherSerNo === person1Father.serNo) {
    return { english: 'Uncle/Aunt', marathi: 'काका/मावशी' };
  }
  if (person2Father && person1.fatherSerNo === person2Father.serNo) {
    return { english: 'Nephew/Niece', marathi: 'पुतणा/पुतणी' };
  }
  
  // Cousins (same grandfather)
  if (person1Father && person2Father && 
      person1Father.fatherSerNo && person2Father.fatherSerNo &&
      person1Father.fatherSerNo === person2Father.fatherSerNo) {
    return { english: 'Cousin', marathi: 'चुलत भाऊ/बहीण' };
  }
  
  // If no direct relationship found, return null
  return null;
}

// DBA CRUD Operations for Family Members
// Get all family members (DBA only)
app.get('/api/dba/family-members', verifyToken, requireDBA, async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    const members = await collection.find({}).toArray();
    res.json({ members });
  } catch (err) {
    console.error('Error fetching family members:', err);
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

// Create new family member (DBA only)
app.post('/api/dba/family-members', verifyToken, requireDBA, async (req, res) => {
  try {
    // Accept flat dot-notated keys from the frontend and nest them
    const memberData = nestObject(req.body);
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    // Add timestamps
    memberData.createdAt = new Date();
    memberData.updatedAt = new Date();
    
    const result = await collection.insertOne(memberData);
    res.status(201).json({ 
      message: 'Family member created successfully',
      member: { ...memberData, _id: result.insertedId }
    });
  } catch (err) {
    console.error('Error creating family member:', err);
    res.status(500).json({ error: 'Failed to create family member' });
  }
});

// Update family member (DBA only)
app.put('/api/dba/family-members/:id', verifyToken, requireDBA, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    // Add update timestamp
    updateData.updatedAt = new Date();
    
    const result = await collection.updateOne(
      { _id: new (await import('mongodb')).ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Family member not found' });
    }
    
    res.json({ message: 'Family member updated successfully' });
  } catch (err) {
    console.error('Error updating family member:', err);
    res.status(500).json({ error: 'Failed to update family member' });
  }
});

// Delete family member (DBA only)
app.delete('/api/dba/family-members/:id', verifyToken, requireDBA, async (req, res) => {
  try {
    const { id } = req.params;
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    const result = await collection.deleteOne({ _id: new (await import('mongodb')).ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Family member not found' });
    }
    
    res.json({ message: 'Family member deleted successfully' });
  } catch (err) {
    console.error('Error deleting family member:', err);
    res.status(500).json({ error: 'Failed to delete family member' });
  }
});

// Get family member by ID (DBA only)
app.get('/api/dba/family-members/:id', verifyToken, requireDBA, async (req, res) => {
  try {
    const { id } = req.params;
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    const member = await collection.findOne({ _id: new (await import('mongodb')).ObjectId(id) });
    
    if (!member) {
      return res.status(404).json({ error: 'Family member not found' });
    }
    
    res.json({ member });
  } catch (err) {
    console.error('Error fetching family member:', err);
    res.status(500).json({ error: 'Failed to fetch family member' });
  }
});

// Test endpoint to check if API is working
app.get('/api/dba/test', verifyToken, requireDBA, async (req, res) => {
  try {
    res.json({ message: 'DBA API is working', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in DBA test endpoint:', error);
    res.status(500).json({ error: 'DBA test endpoint failed', details: error.message });
  }
});

// Get member relationships (DBA only)
app.get('/api/dba/member-relationships/:id', verifyToken, requireDBA, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching relationships for member ID:', id);
    
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    // Try to find member by ObjectId first, then by string ID
    let member;
    try {
      member = await collection.findOne({ _id: new (await import('mongodb')).ObjectId(id) });
    } catch (objectIdError) {
      console.log('ObjectId conversion failed, trying string match:', objectIdError.message);
      member = await collection.findOne({ _id: id });
    }
    
    if (!member) {
      console.log('Member not found with ID:', id);
      return res.status(404).json({ error: 'Member not found' });
    }
    
    console.log('Found member:', member.name || member.firstName || 'Unknown');
    
    // Get all members for relationship calculation
    const allMembers = await collection.find({}).toArray();
    console.log('Total members in database:', allMembers.length);
    
    // Calculate relationships
    const relationships = [];
    
    allMembers.forEach(otherMember => {
      if (otherMember._id.toString() === member._id.toString()) return; // Skip self
      
      const relation = calculateRelationship(member, otherMember, allMembers);
      if (relation) {
        relationships.push({
          member: {
            id: otherMember._id,
            name: otherMember.name || (otherMember.firstName && otherMember.lastName ? `${otherMember.firstName} ${otherMember.lastName}` : otherMember.firstName || otherMember.lastName || 'Unknown'),
            status: otherMember.status || 'Unknown'
          },
          relationEnglish: relation.english,
          relationMarathi: relation.marathi
        });
      }
    });
    
    console.log('Found relationships:', relationships.length);
    
    res.json({
      member: {
        id: member._id,
        name: member.name || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.firstName || member.lastName || 'Unknown'),
        status: member.status || 'Unknown'
      },
      relationships
    });
  } catch (err) {
    console.error('Error fetching member relationships:', err);
    res.status(500).json({ error: 'Failed to fetch member relationships', details: err.message });
  }
});

// Get database statistics (DBA only)
app.get('/api/dba/stats', verifyToken, requireDBA, async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    const totalMembers = await collection.countDocuments();
    const livingMembers = await collection.countDocuments({ status: 'living' });
    const deceasedMembers = await collection.countDocuments({ status: 'deceased' });
    
    // Get recent additions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAdditions = await collection.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });
    
    res.json({
      totalMembers,
      livingMembers,
      deceasedMembers,
      recentAdditions
    });
  } catch (err) {
    console.error('Error fetching database stats:', err);
    res.status(500).json({ error: 'Failed to fetch database statistics' });
  }
});

// Simple test endpoint (no auth required)
app.get('/api/test', (req, res) => {
  try {
    res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error responding to /api/test:', error);
    res.status(500).json({ error: 'Health check failed', details: error.message });
  }
});

// Make connectToMongo available to routes BEFORE mounting them
app.use(async (req, res, next) => {
  try {
    req.app.locals.connectToMongo = connectToMongo;
    req.app.locals.db = await connectToMongo();
    next();
  } catch (error) {
    console.error('Error attaching Mongo connection to request:', error);
    next(error);
  }
});

app.use('/api/auth', createAuthRouter(connectToMongo));
app.use('/api/news', newsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/media', mediaRouter);

// Admin routes
app.get('/api/admin/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const db = await connectToMongo();
    const familyCollection = db.collection(collectionName);
    
    // Get family member statistics
    const totalMembers = await familyCollection.countDocuments();
    const livingMembers = await familyCollection.countDocuments({ 
      $or: [
        { 'Death Date': { $exists: false } },
        { 'Death Date': null },
        { 'Death Date': '' }
      ]
    });
    const deceasedMembers = await familyCollection.countDocuments({ 
      'Death Date': { $exists: true, $ne: null, $ne: '' }
    });
    
    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAdditions = await familyCollection.countDocuments({
      'Registration Date': { $gte: thirtyDaysAgo }
    });

    res.json({
      totalMembers,
      livingMembers,
      deceasedMembers,
      recentAdditions,
      pendingApprovals: 4, // Mock data for admin panel
      approvedMembers: 3,
      rejectedRequests: 1
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// Admin family management routes
app.get('/api/admin/family-members', verifyToken, requireAdmin, async (req, res) => {
  try {
    const db = await connectToMongo();
    const familyCollection = db.collection(collectionName);
    
    const members = await familyCollection.find({}).toArray();
    res.json(members);
  } catch (err) {
    console.error('Error fetching family members:', err);
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

// Admin news management routes
app.get('/api/admin/news', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Mock news data for admin panel
    const news = [
      {
        id: 1,
        title: "GogateKulMandal Annual Meeting 2024",
        content: "Our kulamandal's annual meeting was successfully concluded.",
        author: "Narayan Shankar",
        category: "announcement",
        status: "published",
        createdAt: new Date().toISOString(),
        likes: 24,
        comments: 8
      }
    ];
    res.json(news);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Hierarchical Family Tree Endpoint - Single Root Node (Fixed for nested schema)
app.get('/api/family/hierarchical-tree', async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    const allMembers = await collection.find({}).toArray();
    
    console.log(`[HIERARCHICAL] Building single-root tree from ${allMembers.length} members`);
    
    // Helper function to get full name from nested structure
    function getFullName(member) {
      // Try nested schema first (newer format)
      if (member.personalDetails) {
        const first = member.personalDetails.firstName || '';
        const middle = member.personalDetails.middleName || '';
        const last = member.personalDetails.lastName || '';
        return `${first} ${middle} ${last}`.trim().replace(/\s+/g, ' ');
      }
      // Fallback to flat structure (older format)
      const first = member["First Name"] || member.firstName || '';
      const middle = member["Middle Name"] || member.middleName || '';
      const last = member["Last Name"] || member.lastName || '';
      return `${first} ${middle} ${last}`.trim().replace(/\s+/g, ' ');
    }

    // Helper function to get father's name from nested structure
    function getFatherName(member) {
      // Try nested schema first
      if (member.parentsInformation) {
        const first = member.parentsInformation.fatherFirstName || '';
        const middle = member.parentsInformation.fatherMiddleName || '';
        const last = member.parentsInformation.fatherLastName || '';
        return `${first} ${middle} ${last}`.trim().replace(/\s+/g, ' ');
      }
      // Fallback to flat structure
      const first = member["Father 's First Name "] || member["Father's First Name"] || '';
      const last = member["Father 's Last Name "] || member["Father's Last Name"] || '';
      return `${first} ${last}`.trim().replace(/\s+/g, ' ');
    }

    // Helper to get spouse name
    function getSpouseName(member) {
      if (member.marriedDetails) {
        const first = member.marriedDetails.spouseFirstName || '';
        const last = member.marriedDetails.spouseLastName || '';
        return `${first} ${last}`.trim().replace(/\s+/g, ' ');
      }
      return '';
    }

    // Helper to get gender
    function getGender(member) {
      if (member.personalDetails) return member.personalDetails.gender || 'Unknown';
      return member.Gender || 'Unknown';
    }

    // Create a map of all people by serNo (primary key)
    const memberMap = new Map();
    const childrenMap = new Map(); // Map of fatherSerNo to array of children
    
    allMembers.forEach(member => {
      if (member.serNo !== undefined && member.serNo !== null) {
        memberMap.set(member.serNo, member);
        
        // Build children map for faster lookups
        const fatherSerNo = member.fatherSerNo;
        if (fatherSerNo !== undefined && fatherSerNo !== null && fatherSerNo !== '') {
          if (!childrenMap.has(fatherSerNo)) {
            childrenMap.set(fatherSerNo, []);
          }
          childrenMap.get(fatherSerNo).push(member);
        }
      }
    });

    // Helper function to build tree node in CardFamilyTree format
    function buildTreeNode(member, processed = new Set()) {
      if (!member || processed.has(member.serNo)) {
        return null;
      }
      processed.add(member.serNo);

      const fullName = getFullName(member);
      const fatherSerNo = member.fatherSerNo;
      const spouseName = getSpouseName(member);

      // Get children - use pre-built map for O(1) lookup instead of O(n)
      const children = [];
      const memberChildren = childrenMap.get(member.serNo) || [];
      memberChildren.forEach(childMember => {
        if (!processed.has(childMember.serNo)) {
          const childNode = buildTreeNode(childMember, processed);
          if (childNode) children.push(childNode);
        }
      });

      return {
        name: fullName || `Member #${member.serNo}`,
        attributes: {
          serNo: member.serNo,
          gender: getGender(member),
          spouse: spouseName,
          vansh: member.vansh || '',
          dob: member.personalDetails?.dateOfBirth || member['Date of Birth'] || '',
          email: member.personalDetails?.email || member.Email || ''
        },
        children: children
      };
    }

    // Find root member (someone with no father or serNo 1)
    let rootMember = null;
    
    // First, try to find serNo 1 as root
    for (const member of allMembers) {
      if (member.serNo === 1 || member.serNo === '1') {
        rootMember = member;
        console.log(`[HIERARCHICAL] Using serNo 1 as root: ${getFullName(member)}`);
        break;
      }
    }

    // If no serNo 1, find someone with no father
    if (!rootMember) {
      for (const member of allMembers) {
        if (!member.fatherSerNo || member.fatherSerNo === null || member.fatherSerNo === '') {
          rootMember = member;
          console.log(`[HIERARCHICAL] Using natural root (no father): ${getFullName(member)}`);
          break;
        }
      }
    }

    // Build the tree
    let treeRoot = null;
    if (rootMember) {
      treeRoot = buildTreeNode(rootMember);
    }

    console.log(`[HIERARCHICAL] Tree built successfully. Root: ${rootMember ? getFullName(rootMember) : 'None'}`);

    res.json(treeRoot || {
      name: 'No Family Data',
      attributes: { serNo: 0, gender: 'Unknown', spouse: '', vansh: '' },
      children: []
    });
    
  } catch (err) {
    console.error('Error building single-root hierarchical tree:', err);
    res.status(500).json({ error: 'Failed to build hierarchical family tree' });
  }
});

// Family member registration endpoint - handles comprehensive family form
const uploadFields = upload.fields([
  { name: "personalDetails.profileImage", maxCount: 1 },
  { name: "divorcedDetails.spouseProfileImage", maxCount: 1 },
  { name: "marriedDetails.spouseProfileImage", maxCount: 1 },
  { name: "remarriedDetails.spouseProfileImage", maxCount: 1 },
  { name: "widowedDetails.spouseProfileImage", maxCount: 1 },
  { name: "parentsInformation.fatherProfileImage", maxCount: 1 },
  { name: "parentsInformation.motherProfileImage", maxCount: 1 },
]);

app.post('/api/family/register', uploadFields, parseNestedFields, async (req, res) => {
  try {
    console.log('📥 POST /api/family/register - Family member registration received');
    
    const database = await connectToMongo();
    const collectionName = 'Heirarchy_form'; // Use the form-gkm collection
    const collection = database.collection(collectionName);

    // Convert uploaded files to base64
    const filesData = {};
    if (req.files) {
      Object.entries(req.files).forEach(([fieldPath, files]) => {
        const parsed = fieldPath.split('.');
        const property = parsed.pop();
        const parentPath = parsed.join('.');

        filesData[parentPath] = filesData[parentPath] || {};
        if (files && files.length > 0) {
          const file = files[0];
          filesData[parentPath][property] = {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype,
            originalName: file.originalname,
          };
        }
      });
    }

    // Merge file data into body
    const mergeData = (base, updates) => {
      const result = Array.isArray(base) ? [...base] : { ...base };
      Object.keys(updates).forEach((key) => {
        if (updates[key] && typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
          const existingValue = base?.[key] && typeof base[key] === 'object' ? base[key] : {};
          result[key] = mergeData(existingValue, updates[key]);
        } else {
          result[key] = updates[key];
        }
      });
      return result;
    };

    let payload = req.body;
    if (Object.keys(filesData).length > 0) {
      Object.keys(filesData).forEach((key) => {
        const keys = key.split('.');
        let pointer = payload;
        keys.forEach((k, index) => {
          if (index === keys.length - 1) {
            pointer[k] = mergeData(pointer[k] || {}, filesData[key]);
          } else {
            if (!pointer[k]) pointer[k] = {};
            pointer = pointer[k];
          }
        });
      });
    }

  // Ensure dotted keys are nested correctly
  payload = nestObject(payload);

  // Add timestamp
  payload.createdAt = new Date();
  payload.updatedAt = new Date();

    // Insert the family member
    const result = await collection.insertOne(payload);
    
    console.log(`✅ Family member registered successfully with ID: ${result.insertedId}`);
    res.status(201).json({
      message: 'Family member registered successfully',
      memberId: result.insertedId,
    });
  } catch (err) {
    console.error('❌ Error registering family member:', err);
    res.status(500).json({ error: 'Failed to register family member', details: err.message });
  }
});

// Search parents endpoint for autocomplete
app.get('/api/family/search', async (req, res) => {
  try {
    const { query, vansh } = req.query;
    
    if (!query || !vansh) {
      return res.json({ success: false, data: [] });
    }

    const database = await connectToMongo();
    const collection = database.collection('members'); // Search in main members collection
    
    // Create search regex for flexible matching
    const searchRegex = new RegExp(query, 'i');
    
    const members = await collection.find({
      vansh: parseInt(vansh),
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { 'name': searchRegex }
      ]
    }).limit(10).toArray();

    res.json({
      success: true,
      data: members.map(m => ({
        serNo: m.serNo,
        name: `${m.firstName || ''} ${m.lastName || ''}`.trim(),
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        mobileNumber: m.mobileNumber,
        dateOfBirth: m.dateOfBirth,
      }))
    });
  } catch (err) {
    console.error('Error searching parents:', err);
    res.json({ success: false, data: [], error: err.message });
  }
});

// Family member registration endpoint - accepts multipart form data with images
app.post('/api/family/add', upload.any(), parseNestedFields, async (req, res) => {
  try {
    const parsedData = req.parsedFields || req.body;
    
    const database = await connectToMongo();
    const collection = database.collection('Heirarchy_form');
    
    // Process images - convert to base64 with MIME type
    const processedData = { ...parsedData };
    
    // Helper function to recursively process files in the nested structure
    const processFilesRecursively = (obj, target, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        
        if (Array.isArray(value) && value.length > 0 && value[0].buffer) {
          // This is a file array from multer
          const file = value[0]; // Take first file if multiple
          const base64Data = file.buffer.toString('base64');
          const mimeType = file.mimetype;
          
          // Navigate to the correct nested position in target
          const keys = currentPath.split('.');
          let current = target;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = {
            data: base64Data,
            mimeType: mimeType,
            originalName: file.originalname
          };
        } else if (value && typeof value === 'object' && !Array.isArray(value) && !value.buffer) {
          // Recurse into nested objects
          processFilesRecursively(value, target, currentPath);
        }
      });
    };
    
    if (req.files && typeof req.files === 'object') {
      processFilesRecursively(req.files, processedData);
    }
    
  // Ensure dotted keys are nested correctly
  const processedNested = nestObject(processedData);

  // Add timestamps
  processedNested.createdAt = new Date();
  processedNested.updatedAt = new Date();
    
    const result = await collection.insertOne(processedNested);
    
    res.json({
      success: true,
      message: 'Family member registered successfully!',
      id: result.insertedId,
      data: processedNested
    });
  } catch (err) {
    console.error('Error registering family member:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to register family member: ' + err.message
    });
  }
});

// Example Mongoose-backed create route that demonstrates using await new Model(formattedData).save()
app.post('/api/dba/family-members-mongoose', verifyToken, requireDBA, async (req, res) => {
  try {
    // Convert flat dotted keys into nested objects
    const formatted = nestObject(req.body || {});

    // Use the permissive Member model we initialized above
    const Member = mongoose.models.Member;
    if (!Member) {
      return res.status(500).json({ error: 'Mongoose Member model not initialized' });
    }

    const member = new Member(formatted);
    const saved = await member.save();

    res.status(201).json({ message: 'Member saved via Mongoose', member: saved });
  } catch (err) {
    console.error('Error saving member via Mongoose:', err);
    res.status(500).json({ error: 'Failed to save member via Mongoose', details: err.message });
  }
});

// ============================================
// NEW ENHANCED TREE ENDPOINTS (Schema Compliant)
// ============================================

/**
 * GET /api/family/tree/members-transformed
 * Returns all members transformed for tree components with current schema
 * Filtered by vansh if user is admin
 */
app.get('/api/family/tree/members-transformed', async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    let query = {};
    const { filter: adminFilter, requireAssignment } = getAdminVanshFilterFromRequest(req);
    if (requireAssignment) {
      return res.status(403).json({ error: 'Admin account has no vansh assignment' });
    }
    if (adminFilter && Object.keys(adminFilter).length) {
      query = adminFilter;
    }
    
    const members = await collection.find(query).toArray();
    const transformed = transformMembersForTree(members);
    
    console.log(`[tree] Fetched ${transformed.length} transformed members`);
    res.json(transformed);
  } catch (err) {
    console.error('Error fetching transformed members:', err);
    res.status(500).json({ error: 'Failed to fetch transformed members' });
  }
});

/**
 * GET /api/family/tree/hierarchical
 * Returns members grouped by hierarchy level
 * Filtered by vansh if user is admin
 */
app.get('/api/family/tree/hierarchical', async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    let query = {};
    const { filter: adminFilter, requireAssignment } = getAdminVanshFilterFromRequest(req);
    if (requireAssignment) {
      return res.status(403).json({ error: 'Admin account has no vansh assignment' });
    }
    if (adminFilter && Object.keys(adminFilter).length) {
      query = adminFilter;
    }
    
    const members = await collection.find(query).toArray();
    const transformed = transformMembersForTree(members);
    const hierarchical = getMembersByLevel(transformed);
    
    console.log(`[tree] Generated hierarchical structure with ${Object.keys(hierarchical).length} levels`);
    res.json(hierarchical);
  } catch (err) {
    console.error('Error fetching hierarchical structure:', err);
    res.status(500).json({ error: 'Failed to fetch hierarchical structure' });
  }
});

/**
 * GET /api/family/tree/root/:serNo
 * Returns tree structure rooted at specified member
 * Filtered by vansh if user is admin
 */
app.get('/api/family/tree/root/:serNo', async (req, res) => {
  try {
    const { serNo } = req.params;
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    let query = {};
    const { filter: adminFilter, requireAssignment } = getAdminVanshFilterFromRequest(req);
    if (requireAssignment) {
      return res.status(403).json({ error: 'Admin account has no vansh assignment' });
    }
    if (adminFilter && Object.keys(adminFilter).length) {
      query = adminFilter;
    }
    
    const members = await collection.find(query).toArray();
    const transformed = transformMembersForTree(members);
    const rootSerNo = parseInt(serNo);
    const tree = buildTreeStructure(transformed, rootSerNo);
    
    console.log(`[tree] Built tree rooted at serNo ${serNo}`);
    res.json(tree);
  } catch (err) {
    console.error('Error building tree structure:', err);
    res.status(500).json({ error: 'Failed to build tree structure' });
  }
});

/**
 * GET /api/family/tree/member/:serNo/subtree
 * Returns subtree for a specific member (member and all descendants)
 * Filtered by vansh if user is admin
 */
app.get('/api/family/tree/member/:serNo/subtree', async (req, res) => {
  try {
    const { serNo } = req.params;
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    let query = {};
    const { filter: adminFilter, requireAssignment } = getAdminVanshFilterFromRequest(req);
    if (requireAssignment) {
      return res.status(403).json({ error: 'Admin account has no vansh assignment' });
    }
    if (adminFilter && Object.keys(adminFilter).length) {
      query = adminFilter;
    }
    
    // Fetch the member and all descendants
    const allMembers = await collection.find(query).toArray();
    const transformed = transformMembersForTree(allMembers);
    
    // Find the member and build subtree
    const memberSerNoNum = parseInt(serNo);
    const member = transformed.find(m => m.serNo === memberSerNoNum);
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Track processed members to prevent duplicates
    const processed = new Set();
    
    // Build subtree using member as root
    function buildSubtree(m) {
      // Skip if member already processed (prevents duplicates)
      if (!m || processed.has(m.serNo)) {
        return null;
      }
      processed.add(m.serNo);
      
      const children = [];
      
      // Add spouse
      if (m.spouseSerNo) {
        const spouse = transformed.find(mem => mem.serNo === m.spouseSerNo);
        if (spouse && !processed.has(spouse.serNo)) {
          processed.add(spouse.serNo);
          children.push({
            ...spouse,
            relationToParent: 'spouse'
          });
        }
      }
      
      // Add children
      if (m.childrenSerNos && Array.isArray(m.childrenSerNos)) {
        m.childrenSerNos.forEach(childSerNo => {
          if (!processed.has(childSerNo)) {
            const child = transformed.find(mem => mem.serNo === childSerNo);
            if (child) {
              const childNode = buildSubtree(child);
              if (childNode) {
                children.push(childNode);
              }
            }
          }
        });
      }
      
      return {
        ...m,
        children
      };
    }
    
    const subtree = buildSubtree(member);
    console.log(`[tree] Built subtree for member ${serNo}`);
    res.json(subtree);
  } catch (err) {
    console.error('Error fetching member subtree:', err);
    res.status(500).json({ error: 'Failed to fetch member subtree' });
  }
});

/**
 * GET /api/family/tree/member/:serNo/ancestors
 * Returns all ancestors of a member (lineage upward)
 * Filtered by vansh if user is admin
 */
app.get('/api/family/tree/member/:serNo/ancestors', async (req, res) => {
  try {
    const { serNo } = req.params;
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    let query = {};
    const { filter: adminFilter, requireAssignment } = getAdminVanshFilterFromRequest(req);
    if (requireAssignment) {
      return res.status(403).json({ error: 'Admin account has no vansh assignment' });
    }
    if (adminFilter && Object.keys(adminFilter).length) {
      query = adminFilter;
    }
    
    const allMembers = await collection.find(query).toArray();
    const transformed = transformMembersForTree(allMembers);
    const memberMap = new Map();
    transformed.forEach(m => memberMap.set(m.serNo, m));
    
    const memberSerNoNum = parseInt(serNo);
    const member = memberMap.get(memberSerNoNum);
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Traverse upward to find all ancestors
    const ancestors = [];
    let current = member;
    
    while (current && current.fatherSerNo) {
      const parent = memberMap.get(current.fatherSerNo);
      if (!parent) break;
      ancestors.push(parent);
      current = parent;
    }
    
    console.log(`[tree] Found ${ancestors.length} ancestors for member ${serNo}`);
    res.json({
      member: member,
      ancestors: ancestors
    });
  } catch (err) {
    console.error('Error fetching ancestors:', err);
    res.status(500).json({ error: 'Failed to fetch ancestors' });
  }
});

/**
 * GET /api/family/tree/member/:serNo/descendants
 * Returns all descendants of a member (lineage downward)
 * Filtered by vansh if user is admin
 */
app.get('/api/family/tree/member/:serNo/descendants', async (req, res) => {
  try {
    const { serNo } = req.params;
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    let query = {};
    const { filter: adminFilter, requireAssignment } = getAdminVanshFilterFromRequest(req);
    if (requireAssignment) {
      return res.status(403).json({ error: 'Admin account has no vansh assignment' });
    }
    if (adminFilter && Object.keys(adminFilter).length) {
      query = adminFilter;
    }
    
    const allMembers = await collection.find(query).toArray();
    const transformed = transformMembersForTree(allMembers);
    const memberMap = new Map();
    transformed.forEach(m => memberMap.set(m.serNo, m));
    
    const memberSerNoNum = parseInt(serNo);
    const member = memberMap.get(memberSerNoNum);
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Track processed descendants to prevent duplicates
    const processedDescendants = new Set();
    
    // Recursively collect all descendants
    function collectDescendants(m) {
      const result = [];
      
      if (m.childrenSerNos && Array.isArray(m.childrenSerNos)) {
        m.childrenSerNos.forEach(childSerNo => {
          // Skip if already processed
          if (processedDescendants.has(childSerNo)) {
            return;
          }
          processedDescendants.add(childSerNo);
          
          const child = memberMap.get(childSerNo);
          if (child) {
            result.push(child);
            result.push(...collectDescendants(child));
          }
        });
      }
      
      return result;
    }
    
    const descendants = collectDescendants(member);
    
    console.log(`[tree] Found ${descendants.length} descendants for member ${serNo}`);
    res.json({
      member: member,
      descendants: descendants
    });
  } catch (err) {
    console.error('Error fetching descendants:', err);
    res.status(500).json({ error: 'Failed to fetch descendants' });
  }
});

/**
 * GET /api/family/tree/stats
 * Returns tree statistics
 * Filtered by vansh if user is admin
 */
app.get('/api/family/tree/stats', async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection(collectionName);
    
    let query = {};
    const { filter: adminFilter, requireAssignment } = getAdminVanshFilterFromRequest(req);
    if (requireAssignment) {
      return res.status(403).json({ error: 'Admin account has no vansh assignment' });
    }
    if (adminFilter && Object.keys(adminFilter).length) {
      query = adminFilter;
    }
    
    const allMembers = await collection.find(query).toArray();
    const transformed = transformMembersForTree(allMembers);
    const hierarchical = getMembersByLevel(transformed);
    
    const stats = {
      totalMembers: transformed.length,
      levelCounts: Object.fromEntries(
        Object.entries(hierarchical).map(([level, members]) => [level, members.length])
      ),
      maxLevel: Math.max(...Object.keys(hierarchical).map(l => isNaN(l) ? -1 : parseInt(l))),
      rootMembers: (hierarchical['1'] || hierarchical['0'] || []).length,
      approvedMembers: transformed.filter(m => m.isapproved).length
    };
    
    console.log(`[tree] Stats:`, stats);
    res.json(stats);
  } catch (err) {
    console.error('Error fetching tree stats:', err);
    res.status(500).json({ error: 'Failed to fetch tree stats' });
  }
});

app.get('/api/family/registrations', async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection('Heirarchy_form');
    const { vansh } = req.query;
    
    console.log('[registrations] Received vansh:', vansh, 'Type:', typeof vansh);
    
    let filter = {};
    
    if (vansh !== undefined && vansh !== null && vansh !== '') {
      const vanshValue = Number(vansh);
      if (!isNaN(vanshValue)) {
        filter = {
          $or: [
            { vansh: vanshValue },
            { vansh: vansh },
            { 'personalDetails.vansh': vanshValue },
            { 'personalDetails.vansh': vansh }
          ]
        };
        console.log('[registrations] Applying filter:', JSON.stringify(filter));
      }
    }
    
    const registrations = await collection.find(filter).toArray();
    console.log('[registrations] Found:', registrations.length, 'records');
    res.json({ success: true, data: registrations });
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
  }
});

// Proxy PATCH/PUT requests for registration status to form server
app.patch('/api/family/registrations/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const FORM_SERVER_PORT = process.env.FORM_SERVER_PORT || process.env.FORM_PORT || '5000';
    const formServerUrl = `http://localhost:${FORM_SERVER_PORT}/api/family/registrations/${id}/status`;
    
    console.log(`[proxy] Forwarding PATCH request to form server: ${formServerUrl}`);
    console.log(`[proxy] Request body:`, req.body);
    
    const response = await fetch(formServerUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    console.log(`[proxy] Response status: ${response.status}`);
    console.log(`[proxy] Response data:`, data);
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[proxy] Error forwarding to form server:', err);
    console.error('[proxy] Error stack:', err.stack);
    res.status(500).json({ success: false, error: 'Failed to update registration status', details: err.message });
  }
});

app.get('/api/family/all', async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection('members');
    const { vansh } = req.query;
    
    console.log('[family/all] Received vansh:', vansh, 'Type:', typeof vansh);
    
    let filter = {};
    
    if (vansh !== undefined && vansh !== null && vansh !== '') {
      const vanshValue = Number(vansh);
      if (!isNaN(vanshValue)) {
        filter = {
          $or: [
            { vansh: vanshValue },
            { vansh: vansh },
            { 'personalDetails.vansh': vanshValue },
            { 'personalDetails.vansh': vansh }
          ]
        };
        console.log('[family/all] Applying filter:', JSON.stringify(filter));
      }
    }
    
    const members = await collection.find(filter).toArray();
    console.log('[family/all] Found:', members.length, 'members');
    res.json({ success: true, data: members });
  } catch (err) {
    console.error('Error fetching approved members:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch members' });
  }
});

app.get('/api/family/rejected', async (req, res) => {
  try {
    const database = await connectToMongo();
    const collection = database.collection('rejectedMemb');
    const { vansh } = req.query;
    
    let filter = {};
    
    if (vansh !== undefined && vansh !== null && vansh !== '') {
      const vanshValue = Number(vansh);
      if (!isNaN(vanshValue)) {
        filter = {
          $or: [
            { vansh: vanshValue },
            { vansh: vansh },
            { 'personalDetails.vansh': vanshValue },
            { 'personalDetails.vansh': vansh }
          ]
        };
      }
    }
    
    const rejected = await collection.find(filter).toArray();
    res.json({ success: true, data: rejected });
  } catch (err) {
    console.error('Error fetching rejected members:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch rejected members' });
  }
});

// Proxy PUT requests for member updates to form server
app.put('/api/family/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const FORM_SERVER_PORT = process.env.FORM_SERVER_PORT || process.env.FORM_PORT || '5000';
    const formServerUrl = `http://localhost:${FORM_SERVER_PORT}/api/family/members/${id}`;
    
    console.log(`[proxy] Forwarding PUT request to form server: ${formServerUrl}`);
    
    const response = await fetch(formServerUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[proxy] Error forwarding to form server:', err);
    res.status(500).json({ success: false, error: 'Failed to update member', details: err.message });
  }
});

// Proxy DELETE requests for members to form server
app.delete('/api/family/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const FORM_SERVER_PORT = process.env.FORM_SERVER_PORT || process.env.FORM_PORT || '5000';
    const formServerUrl = `http://localhost:${FORM_SERVER_PORT}/api/family/members/${id}`;
    
    console.log(`[proxy] Forwarding DELETE request to form server: ${formServerUrl}`);
    
    const response = await fetch(formServerUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[proxy] Error forwarding to form server:', err);
    res.status(500).json({ success: false, error: 'Failed to delete member', details: err.message });
  }
});

// Proxy DELETE requests to clear rejected members list
app.delete('/api/family/rejected', async (req, res) => {
  try {
    const FORM_SERVER_PORT = process.env.FORM_SERVER_PORT || process.env.FORM_PORT || '5000';
    const vansh = req.query.vansh;
    const queryString = vansh ? `?vansh=${encodeURIComponent(vansh)}` : '';
    const formServerUrl = `http://localhost:${FORM_SERVER_PORT}/api/family/rejected${queryString}`;
    
    console.log(`[proxy] Forwarding DELETE rejected list request to form server: ${formServerUrl}`);
    
    const response = await fetch(formServerUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[proxy] Error forwarding to form server:', err);
    res.status(500).json({ success: false, error: 'Failed to clear rejected list', details: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
  console.log(`Test endpoint: http://localhost:${port}/api/test`);
  console.log(`\n🌳 NEW Tree Endpoints Available:`);
  console.log(`  GET http://localhost:${port}/api/family/tree/members-transformed`);
  console.log(`  GET http://localhost:${port}/api/family/tree/hierarchical`);
  console.log(`  GET http://localhost:${port}/api/family/tree/root/:serNo`);
  console.log(`  GET http://localhost:${port}/api/family/tree/member/:serNo/subtree`);
  console.log(`  GET http://localhost:${port}/api/family/tree/member/:serNo/ancestors`);
  console.log(`  GET http://localhost:${port}/api/family/tree/member/:serNo/descendants`);
  console.log(`  GET http://localhost:${port}/api/family/tree/stats`);
  console.log(`\n👨‍💼 Admin Endpoints Available:`);
  console.log(`  GET http://localhost:${port}/api/family/registrations?vansh=61`);
  console.log(`  GET http://localhost:${port}/api/family/all?vansh=61`);
  console.log(`  GET http://localhost:${port}/api/family/rejected?vansh=61`);
});

// Spin up the form backend inside the same process for unified deployment
const startFormBackendInProcess = async () => {
  try {
    console.log('[startup] Attempting to start form backend...');
    if (!process.env.FORM_SERVER_PORT) {
      process.env.FORM_SERVER_PORT = process.env.FORM_PORT || '5000';
    }
    console.log(`[startup] Form server will use port: ${process.env.FORM_SERVER_PORT}`);
    
    // Construct absolute path to form server
    const formServerPath = join(__dirname, 'form', 'server', 'server.js');
    console.log(`[startup] Loading form server from: ${formServerPath}`);
    
    // Import using file:// URL for Windows compatibility
    const formServerUrl = new URL(`file:///${formServerPath.replace(/\\/g, '/')}`);
    await import(formServerUrl);
    console.log(`✅ [startup] Form backend successfully started on port ${process.env.FORM_SERVER_PORT}`);
  } catch (error) {
    console.error('❌ Failed to start embedded form backend:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
};

startFormBackendInProcess();
