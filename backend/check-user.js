import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'test';

if (!uri) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

async function withDb(handler) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    return await handler(db);
  } catch (error) {
    console.error('Error during database operation:', error);
    throw error;
  } finally {
    await client.close();
  }
}

function normalizeKey(value) {
  return value.replace(/[\s_]/g, '').toLowerCase();
}

async function resolveUsersCollection(db) {
  const configured = (process.env.MONGODB_LOGIN_COLLECTION || process.env.MONGODB_USERS_COLLECTION || process.env.MONGODB_COLLECTION || '').trim();
  const candidates = [];
  if (configured) candidates.push(configured);
  candidates.push('login', 'Login', 'users', 'Users', 'members', 'Members');
  const collections = await db.listCollections({}, { nameOnly: true }).toArray().catch(() => []);
  const names = collections.map(entry => entry.name);
  for (const candidate of candidates) {
    if (names.includes(candidate)) {
      return db.collection(candidate);
    }
  }
  const normalized = new Map(names.map(name => [normalizeKey(name), name]));
  for (const candidate of candidates) {
    const key = normalizeKey(candidate);
    if (normalized.has(key)) {
      return db.collection(normalized.get(key));
    }
  }
  return db.collection(candidates[0] || 'login');
}

async function listCollections() {
  await withDb(async (db) => {
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    console.log('Collections:', collections.map(entry => entry.name));
  });
}

async function inspectUser(username) {
  await withDb(async (db) => {
    const users = await resolveUsersCollection(db);
    const user = await users.findOne({
      $or: [
        { username },
        { username: username.toLowerCase() },
        { Username: username }
      ]
    });
    if (user) {
      console.log('Found user:', user.username || user.Username);
      console.log('Role:', user.role || user.Role || 'user');
      console.log('Email:', user.email || user.Email || 'N/A');
      console.log('Keys:', Object.keys(user).slice(0, 30));
    } else {
      console.log('User not found:', username);
    }
  });
}

function buildAdminDocs() {
  const now = new Date();
  const base = {
    createdAt: now,
    updatedAt: now,
    status: 'active'
  };
  return [
    {
      ...base,
      username: 'admin_vansh_61',
      email: 'admin61@gogtekulavruttanta.in',
      gmail: 'admin61@gogtekulavruttanta.in',
      firstName: 'Vansh',
      lastName: 'SixtyOne',
      role: 'admin',
      managedVansh: 61,
      serNo: 610001,
      password: 'Admin61@123'
    },
    {
      ...base,
      username: 'admin_vansh_64',
      email: 'admin64@gogtekulavruttanta.in',
      gmail: 'admin64@gogtekulavruttanta.in',
      firstName: 'Vansh',
      lastName: 'SixtyFour',
      role: 'admin',
      managedVansh: 64,
      serNo: 640001,
      password: 'Admin64@123'
    },
    {
      ...base,
      username: 'admin_vansh_50',
      email: 'admin50@gogtekulavruttanta.in',
      gmail: 'admin50@gogtekulavruttanta.in',
      firstName: 'Vansh',
      lastName: 'Fifty',
      role: 'admin',
      managedVansh: 50,
      serNo: 500001,
      password: 'Admin50@123'
    },
    {
      ...base,
      username: 'master_admin',
      email: 'masteradmin@gogtekulavruttanta.in',
      gmail: 'masteradmin@gogtekulavruttanta.in',
      firstName: 'Master',
      lastName: 'Administrator',
      role: 'admin',
      isMasterAdmin: true,
      serNo: 999999,
      password: 'MasterAdmin@123'
    }
  ];
}

async function ensureAdmins() {
  await withDb(async (db) => {
    const users = await resolveUsersCollection(db);
    const docs = buildAdminDocs();
    for (const doc of docs) {
      const query = { $or: [{ username: doc.username }, { Username: doc.username }, { email: doc.email }, { Email: doc.email }] };
      const { createdAt, ...rest } = doc;
      rest.updatedAt = new Date();
      const result = await users.updateOne(query, { $set: rest, $setOnInsert: { createdAt } }, { upsert: true });
      if (result.upsertedCount === 1) {
        console.log('Inserted:', doc.username);
      } else {
        console.log('Updated:', doc.username);
      }
    }
  });
}

async function showAdmins() {
  await withDb(async (db) => {
    const users = await resolveUsersCollection(db);
    const admins = await users.find({ role: { $in: ['admin', 'Admin'] } }).project({ username: 1, email: 1, role: 1, managedVansh: 1, isMasterAdmin: 1 }).limit(50).toArray();
    console.log('Admins:', admins);
  });
}

const mode = process.argv[2] || 'inspect';
const value = process.argv[3] || 'umesh_8883';

(async () => {
  try {
    if (mode === 'list') {
      await listCollections();
    } else if (mode === 'ensure-admins') {
      await ensureAdmins();
    } else if (mode === 'show-admins') {
      await showAdmins();
    } else {
      await inspectUser(value);
    }
  } catch (error) {
    console.error('Fatal error in check-user script:', error);
    process.exit(1);
  }
})();
