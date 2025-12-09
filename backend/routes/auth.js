import express from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export default function createAuthRouter(connectToMongo) {
  const router = express.Router();

  const masterAdminUsername = (process.env.MASTER_ADMIN_USERNAME || 'master_admin').trim() || 'master_admin';
  const masterAdminPassword = process.env.MASTER_ADMIN_PASSWORD || 'MasterAdmin@123';
  const masterAdminSerNo = (process.env.MASTER_ADMIN_SERNO || 'ADM').trim() || 'ADM';
  const masterAdminEmail = (process.env.MASTER_ADMIN_EMAIL || 'master_admin@gogtekulavrutta.app').trim() || 'master_admin@gogtekulavrutta.app';

  async function getUsersCollection(db) {
    const configured = (process.env.MONGODB_LOGIN_COLLECTION || process.env.MONGODB_USERS_COLLECTION || process.env.MONGODB_COLLECTION || '').trim();
    const candidates = [];
    if (configured) candidates.push(configured);
    candidates.push('login', 'Login', 'users', 'Users');
    const available = await db.listCollections({}, { nameOnly: true }).toArray().catch(() => []);
    const names = available.map(entry => entry.name);
    for (const candidate of candidates) {
      if (names.includes(candidate)) {
        return db.collection(candidate);
      }
    }
    const normalized = new Map(names.map(name => [name.replace(/[\s_]/g, '').toLowerCase(), name]));
    for (const candidate of candidates) {
      const match = normalized.get(candidate.replace(/[\s_]/g, '').toLowerCase());
      if (match) {
        return db.collection(match);
      }
    }
    return db.collection(candidates[0] || 'login');
  }

  function sanitizeEmailValue(value) {
    const str = String(value || '').trim();
    return str;
  }

  function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function findFieldValue(source, fields) {
    for (const field of fields) {
      if (source[field] !== undefined && source[field] !== null && source[field] !== '') {
        return source[field];
      }
    }
    const lookup = new Map();
    for (const key of Object.keys(source)) {
      lookup.set(key.replace(/[\s_]/g, '').toLowerCase(), source[key]);
    }
    for (const field of fields) {
      const key = field.replace(/[\s_]/g, '').toLowerCase();
      if (lookup.has(key)) {
        return lookup.get(key);
      }
    }
    return null;
  }

  const emailFields = [
    'email',
    'Email',
    'gmail',
    'Gmail',
    'username',
    'Username',
    'userEmail',
    'UserEmail',
    'emailId',
    'EmailId',
    'EmailID',
    'emailID',
    'Email Address',
    'Email address',
    'Email_Address',
    'EmailAddress',
    'email_address',
    'emailAddress',
    'login',
    'Login',
    'primaryEmail',
    'PrimaryEmail'
  ];

  const passwordFields = [
    'password',
    'Password',
    'pass',
    'Pass',
    'pwd',
    'Pwd',
    'passwordHash',
    'PasswordHash',
    'Password Hash',
    'Passcode',
    'PassCode'
  ];
  
  const extractPassword = (userDoc) => findFieldValue(userDoc, passwordFields);
  const buildPasswordUpdate = (newPassword) => {
    const update = {};
    passwordFields.forEach((field) => {
      update[field] = newPassword;
    });
    update.updatedAt = new Date();
    update.passwordUpdatedAt = new Date();
    return update;
  };

  router.post('/register', async (req, res) => {
    try {
      const { firstName, lastName, email, password, confirmPassword, phoneNumber, dateOfBirth, gender, occupation } = req.body;
      const sanitizedEmail = sanitizeEmailValue(email);
      if (!sanitizedEmail || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
      const db = await connectToMongo();
      const users = await getUsersCollection(db);
      const emailLower = sanitizedEmail.toLowerCase();
      const emailRegex = new RegExp(`^${escapeRegex(emailLower)}$`, 'i');
      const existing = await users.findOne({
        $or: emailFields.map(field => ({ [field]: emailRegex }))
      });
      if (existing) {
        return res.status(409).json({ message: 'Email already registered' });
      }
      const doc = {
        firstName,
        lastName,
        email: emailLower,
        gmail: emailLower,
        password,
        phoneNumber: phoneNumber || '',
        dateOfBirth: dateOfBirth || '',
        gender: gender || '',
        occupation: occupation || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await users.insertOne(doc);
      const userId = result.insertedId;
      const token = jwt.sign({ sub: String(userId), email: doc.email }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
      return res.status(201).json({
        message: 'Registration successful',
        token,
        user: { id: String(userId), firstName: doc.firstName, lastName: doc.lastName, email: doc.email }
      });
    } catch (err) {
      console.error('[auth] register error', err);
      return res.status(500).json({ message: 'Registration failed' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const sanitizedEmailInput = sanitizeEmailValue(req.body.email);
      const inputPassword = String(req.body.password || '');
      if (!sanitizedEmailInput || !inputPassword) {
        console.log('[auth] login failed: missing email or password');
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const lowerInput = sanitizedEmailInput.toLowerCase();
      const masterUsernameLower = masterAdminUsername.toLowerCase();
      const masterSerNoLower = masterAdminSerNo.toLowerCase();
      const isMasterAdminAttempt = lowerInput === masterUsernameLower || lowerInput === masterSerNoLower;

      if (isMasterAdminAttempt) {
        if (inputPassword !== masterAdminPassword) {
          console.log('[auth] master admin login: invalid password');
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({
          sub: 'master_admin',
          email: masterAdminEmail.toLowerCase(),
          role: 'master_admin',
          serNo: masterAdminSerNo,
          username: masterAdminUsername,
          managedVansh: null,
          isMasterAdmin: true
        }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });

        return res.json({
          message: 'Master admin login successful',
          token,
          user: {
            id: 'master_admin',
            firstName: 'Master',
            lastName: 'Administrator',
            email: masterAdminEmail.toLowerCase(),
            role: 'master_admin',
            serNo: masterAdminSerNo,
            username: masterAdminUsername,
            managedVansh: null,
            isMasterAdmin: true
          }
        });
      }

      if (sanitizedEmailInput === process.env.DBA_EMAIL && inputPassword === process.env.DBA_PASSWORD) {
        const db = await connectToMongo();
        const adminsCollection = db.collection('admins');
        const adminRecord = await adminsCollection.findOne({ email: sanitizedEmailInput });
        const managedVansh = adminRecord?.managedVansh || null;
        
        const token = jwt.sign({
          sub: 'dba_admin',
          email: sanitizedEmailInput,
          role: 'dba',
          managedVansh: managedVansh
        }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
        return res.json({
          message: 'DBA Login successful',
          token,
          user: {
            id: 'dba_admin',
            firstName: 'Database',
            lastName: 'Administrator',
            email: sanitizedEmailInput,
            role: 'dba',
            managedVansh: managedVansh
          }
        });
      }
      if (sanitizedEmailInput === process.env.ADMIN_EMAIL && inputPassword === process.env.ADMIN_PASSWORD) {
        const db = await connectToMongo();
        const adminsCollection = db.collection('admins');
        const adminRecord = await adminsCollection.findOne({ email: sanitizedEmailInput });
        const managedVansh = adminRecord?.managedVansh || null;
        
        const token = jwt.sign({
          sub: 'admin_user',
          email: sanitizedEmailInput,
          role: 'admin',
          managedVansh: managedVansh
        }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
        return res.json({
          message: 'Admin Login successful',
          token,
          user: {
            id: 'admin_user',
            firstName: 'System',
            lastName: 'Administrator',
            email: sanitizedEmailInput,
            role: 'admin',
            managedVansh: managedVansh
          }
        });
      }
      const db = await connectToMongo();
      const usersCollection = await getUsersCollection(db);
      const loginCollection = db.collection('login');
      const normalizedInput = sanitizedEmailInput.toLowerCase();
      
      // Check if input is username (no @ symbol) or email
      const isUsername = !sanitizedEmailInput.includes('@');
      
      let user = null;
      
      if (isUsername) {
        // Direct username lookup - try both collections (case-insensitive)
        user = await usersCollection.findOne({
          $or: [
            { username: { $regex: new RegExp(`^${escapeRegex(normalizedInput)}$`, 'i') } },
            { Username: { $regex: new RegExp(`^${escapeRegex(normalizedInput)}$`, 'i') } }
          ]
        });
        
        // If not found in users collection, try login collection
        if (!user) {
          user = await loginCollection.findOne({
            $or: [
              { username: { $regex: new RegExp(`^${escapeRegex(normalizedInput)}$`, 'i') } },
              { Username: { $regex: new RegExp(`^${escapeRegex(normalizedInput)}$`, 'i') } }
            ]
          });
        }
      } else {
        // Email lookup with existing logic
        const emailRegex = new RegExp(`^${escapeRegex(normalizedInput)}$`, 'i');
        user = await usersCollection.findOne({
          $or: emailFields.map(field => ({ [field]: emailRegex }))
        });
        if (!user) {
          const pipeline = [
            {
              $addFields: {
                __emails: emailFields.map(field => ({ field, value: { $ifNull: [`$${field}`, ''] } }))
              }
            },
            {
              $match: {
                __emails: {
                  $elemMatch: {
                    value: { $type: 'string' },
                    $expr: {
                      $eq: [
                        { $toLower: '$$this.value' },
                        normalizedInput
                      ]
                    }
                  }
                }
              }
            },
            { $limit: 1 }
          ];
          user = await usersCollection.aggregate(pipeline).next();
        }
        
        // If not found in users collection, try login collection
        if (!user) {
          user = await loginCollection.findOne({
            $or: emailFields.map(field => ({ [field]: emailRegex }))
          });
        }
      }
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const storedPasswordValue = findFieldValue(user, passwordFields);
      const storedPassword = storedPasswordValue !== null && storedPasswordValue !== undefined ? String(storedPasswordValue) : '';
      let ok = false;
      if (storedPassword.startsWith('$2')) {
        const { default: bcrypt } = await import('bcryptjs');
        ok = await bcrypt.compare(inputPassword, storedPassword);
      } else {
        ok = storedPassword === inputPassword;
      }
      if (!ok) {
        console.log('[auth] login: password mismatch', {
          userId: user._id?.toString?.() || 'unknown',
          matchedPasswordField: passwordFields.find(field => user[field] !== undefined && user[field] !== null && user[field] !== '') || null
        });
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const resolvedEmailValue = findFieldValue(user, emailFields) || sanitizedEmailInput;
      const resolvedRole = user.role || user.Role || user.userRole || 'user';
      const serNo = user.serNo || user.SerNo || user.serno || null;
      const username = user.username || user.Username || null;
      const token = jwt.sign({
        sub: String(user._id),
        email: String(resolvedEmailValue).toLowerCase(),
        role: resolvedRole,
        serNo: serNo,
        username: username
      }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: String(user._id),
          firstName: user.firstName || user.FirstName || user.firstname || '',
          lastName: user.lastName || user.LastName || user.lastname || '',
          email: String(resolvedEmailValue).toLowerCase(),
          role: resolvedRole,
          serNo: serNo,
          username: username
        }
      });
    } catch (err) {
      console.error('[auth] login error', err);
      return res.status(500).json({ message: 'Login failed' });
    }
  });

  router.post('/change-password', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }

      // Master admin password is defined via env; do not change it here.
      if (decoded.sub === 'master_admin' || decoded.role === 'master_admin') {
        if (currentPassword !== masterAdminPassword) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
        return res.status(400).json({ message: 'Master admin password cannot be changed from this endpoint' });
      }

      const db = await connectToMongo();
      const usersCollection = await getUsersCollection(db);
      const loginCollection = db.collection('login');

      let user = null;
      if (decoded.sub) {
        user = await usersCollection.findOne({ _id: new ObjectId(decoded.sub) });
        if (!user) {
          user = await loginCollection.findOne({ _id: new ObjectId(decoded.sub) });
        }
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const storedPassword = extractPassword(user);
      if (!storedPassword) {
        return res.status(400).json({ message: 'No password is set for this account' });
      }
      if (String(storedPassword) !== String(currentPassword)) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const update = buildPasswordUpdate(newPassword);
      const targetCollection = user._id && usersCollection ? usersCollection : loginCollection;
      await targetCollection.updateOne(
        { _id: user._id },
        { $set: update }
      );

      return res.json({ message: 'Password updated successfully' });
    } catch (err) {
      console.error('[auth] change-password error', err);
      return res.status(500).json({ message: 'Failed to change password' });
    }
  });

  router.get('/me', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token provided' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      const db = await connectToMongo();
      
      let user = null;
      let managedVansh = null;
      
      if (decoded.sub === 'admin_user') {
        return res.json({
          firstName: 'System',
          lastName: 'Administrator',
          username: 'admin',
          email: decoded.email,
          role: 'admin',
          managedVansh: decoded.managedVansh || null
        });
      }

      if (decoded.sub === 'master_admin' || decoded.role === 'master_admin') {
        return res.json({
          firstName: 'Master',
          lastName: 'Administrator',
          username: masterAdminUsername,
          email: masterAdminEmail.toLowerCase(),
          role: 'master_admin',
          managedVansh: null,
          serNo: masterAdminSerNo,
          isMasterAdmin: true
        });
      }

      if (decoded.sub === 'dba_admin') {
        return res.json({
          firstName: 'Database',
          lastName: 'Administrator',
          username: 'dba',
          email: decoded.email,
          role: 'dba',
          managedVansh: decoded.managedVansh || null
        });
      }
      
      // Get login user first to extract username - try both collections
      const usersCollection = await getUsersCollection(db);
      const loginCollection = db.collection('login');
      
      user = await usersCollection.findOne({ _id: new ObjectId(decoded.sub) });
      if (!user) {
        user = await loginCollection.findOne({ _id: new ObjectId(decoded.sub) });
      }
      
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      // Extract username from login user
      const username = user.username || user.Username || '';
      
      // Now lookup the members collection directly by username (root level)
      const membersCollection = db.collection('members');
      const member = await membersCollection.findOne({ username: username });
      
      let firstName = '';
      let memberVanshNo = null;
      let email = '';
      managedVansh = user.managedVansh || user.ManagedVansh || null;
      
      if (member) {
        // Extract from personalDetails (nested structure)
        firstName = member.personalDetails?.firstName || member.personalDetails?.FirstName || '';
        const middleName = member.personalDetails?.middleName || '';
        const lastName = member.personalDetails?.lastName || '';
        memberVanshNo = member.personalDetails?.vansh || member.personalDetails?.Vansh || member.vansh || member.Vansh || null;
        email = member.personalDetails?.email || member.personalDetails?.Email || '';
        const phone = member.personalDetails?.mobileNumber || '';
        const dateOfBirth = member.personalDetails?.dateOfBirth || '';
        const occupation = member.personalDetails?.profession || '';
        const maritalStatus = member.personalDetails?.everMarried || 'Single';
        const profileImage = member.personalDetails?.profileImage || null;
        
        // Address details
        const address = {
          street: member.personalDetails?.colonyStreet || '',
          city: member.personalDetails?.city || '',
          state: member.personalDetails?.state || '',
          pincode: member.personalDetails?.pinCode || '',
          country: member.personalDetails?.country || 'India'
        };
        
        console.log('[auth/me] Returning managedVansh:', managedVansh, 'for user:', username);
        return res.json({
          firstName: firstName,
          middleName: middleName,
          lastName: lastName,
          VanshNo: memberVanshNo,
          username: username,
          email: email,
          phone: phone,
          dateOfBirth: dateOfBirth,
          occupation: occupation,
          maritalStatus: maritalStatus,
          profilePicture: profileImage, // Return full image object with data and mimeType
          address: address,
          role: user.role || user.Role || 'user',
          managedVansh: managedVansh
        });
      } else {
        // Fallback to login user data
        firstName = user.firstName || user.FirstName || user.firstname || '';
        email = user.email || user.Email || '';
        
        console.log('[auth/me] Returning managedVansh:', managedVansh, 'for user:', username);
        return res.json({
          firstName: firstName,
          VanshNo: memberVanshNo,
          username: username,
          email: email,
          role: user.role || user.Role || 'user',
          managedVansh: managedVansh
        });
      }
    } catch (err) {
      console.error('[auth/me] error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });  return router;
}
