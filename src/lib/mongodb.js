import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'snooze-agent';

// In-file fallback database when MongoDB_URI is not configured yet
const LOCAL_DB_DIR = path.join(process.cwd(), '.data');
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, 'db.json');

function ensureLocalDb() {
  if (!fs.existsSync(LOCAL_DB_DIR)) {
    fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DB_FILE)) {
    const initial = { repos: [], issues: [], activities: [], settings: {} };
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const content = fs.readFileSync(LOCAL_DB_FILE, 'utf8');
    return JSON.parse(content || '{}');
  } catch {
    return { repos: [], issues: [], activities: [], settings: {} };
  }
}

function saveLocalDb(data) {
  try {
    if (!fs.existsSync(LOCAL_DB_DIR)) {
      fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving local db:', err);
  }
}

// Fallback collection implementation mirroring MongoDB subset
class LocalCollection {
  constructor(name) {
    this.name = name;
  }

  _getItems() {
    const db = ensureLocalDb();
    if (!db[this.name]) {
      db[this.name] = [];
      saveLocalDb(db);
    }
    return db[this.name];
  }

  _saveItems(items) {
    const db = ensureLocalDb();
    db[this.name] = items;
    saveLocalDb(db);
  }

  find(query = {}) {
    let items = this._getItems();
    // Filter
    items = items.filter((item) => matchQuery(item, query));
    
    return {
      _items: items,
      _sort: null,
      _skip: 0,
      _limit: null,
      sort(sortObj) {
        this._sort = sortObj;
        return this;
      },
      skip(n) {
        this._skip = n;
        return this;
      },
      limit(n) {
        this._limit = n;
        return this;
      },
      project() {
        return this;
      },
      async toArray() {
        let result = [...this._items];
        if (this._sort) {
          const keys = Object.keys(this._sort);
          result.sort((a, b) => {
            for (const key of keys) {
              const dir = this._sort[key];
              const valA = getNestedValue(a, key);
              const valB = getNestedValue(b, key);
              if (valA > valB) return dir;
              if (valA < valB) return -dir;
            }
            return 0;
          });
        }
        if (this._skip) {
          result = result.slice(this._skip);
        }
        if (this._limit !== null) {
          result = result.slice(0, this._limit);
        }
        return result;
      },
    };
  }

  async findOne(query) {
    const items = this._getItems();
    return items.find((item) => matchQuery(item, query)) || null;
  }

  async insertOne(doc) {
    const items = this._getItems();
    const newDoc = {
      ...doc,
      _id: doc._id || 'local_' + Math.random().toString(36).substring(2, 11),
      createdAt: doc.createdAt || new Date(),
    };
    items.unshift(newDoc);
    this._saveItems(items);
    return { insertedId: newDoc._id };
  }

  async updateOne(query, update, options = {}) {
    const items = this._getItems();
    const index = items.findIndex((item) => matchQuery(item, query));
    
    if (index !== -1) {
      if (update.$set) {
        items[index] = { ...items[index], ...update.$set };
      } else {
        items[index] = { ...items[index], ...update };
      }
      this._saveItems(items);
      return { matchedCount: 1, modifiedCount: 1 };
    } else if (options.upsert && update.$set) {
      const newDoc = {
        ...update.$set,
        _id: 'local_' + Math.random().toString(36).substring(2, 11),
      };
      items.unshift(newDoc);
      this._saveItems(items);
      return { upsertedId: newDoc._id };
    }
    return { matchedCount: 0, modifiedCount: 0 };
  }

  async deleteOne(query) {
    let items = this._getItems();
    const initialLen = items.length;
    items = items.filter((item) => !matchQuery(item, query));
    this._saveItems(items);
    return { deletedCount: initialLen - items.length };
  }

  async deleteMany(query) {
    let items = this._getItems();
    const initialLen = items.length;
    items = items.filter((item) => !matchQuery(item, query));
    this._saveItems(items);
    return { deletedCount: initialLen - items.length };
  }

  async countDocuments(query = {}) {
    const items = this._getItems();
    return items.filter((item) => matchQuery(item, query)).length;
  }

  async createIndex() {
    return true;
  }

  async aggregate(pipeline = []) {
    let items = this._getItems();
    for (const stage of pipeline) {
      if (stage.$match) {
        items = items.filter((item) => matchQuery(item, stage.$match));
      }
      if (stage.$group) {
        const idField = stage.$group._id;
        const groups = {};
        for (const item of items) {
          let key = 'all';
          if (typeof idField === 'string' && idField.startsWith('$')) {
            key = getNestedValue(item, idField.slice(1)) || 'unknown';
          } else if (idField && typeof idField === 'object' && idField.$dateToString) {
            const dateVal = new Date(getNestedValue(item, idField.$dateToString.date.slice(1)));
            key = isNaN(dateVal.getTime()) ? 'unknown' : dateVal.toISOString().slice(0, 10);
          }
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
        }
        items = Object.keys(groups).map((key) => {
          const res = { _id: key };
          for (const [field, op] of Object.entries(stage.$group)) {
            if (field === '_id') continue;
            if (op.$sum === 1) res[field] = groups[key].length;
            else if (op.$first) res[field] = getNestedValue(groups[key][0], op.$first.slice(1));
            else if (op.$push) res[field] = groups[key].map((g) => getNestedValue(g, op.$push.slice(1)));
            else if (op.$min) res[field] = groups[key].map((g) => getNestedValue(g, op.$min.slice(1))).sort()[0];
            else if (op.$max) res[field] = groups[key].map((g) => getNestedValue(g, op.$max.slice(1))).sort().reverse()[0];
          }
          return res;
        });
      }
      if (stage.$sort) {
        const keys = Object.keys(stage.$sort);
        items.sort((a, b) => {
          for (const k of keys) {
            const dir = stage.$sort[k];
            if (a[k] > b[k]) return dir;
            if (a[k] < b[k]) return -dir;
          }
          return 0;
        });
      }
      if (stage.$limit) {
        items = items.slice(0, stage.$limit);
      }
    }
    return items;
  }
}

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[part];
  }
  return curr;
}

function matchQuery(item, query) {
  if (!query || Object.keys(query).length === 0) return true;
  for (const [key, val] of Object.entries(query)) {
    if (key === '$or' && Array.isArray(val)) {
      const matchAny = val.some((subQuery) => matchQuery(item, subQuery));
      if (!matchAny) return false;
      continue;
    }
    const itemVal = getNestedValue(item, key);
    if (val && typeof val === 'object') {
      if (val.$regex !== undefined) {
        const regex = new RegExp(val.$regex, val.$options || '');
        if (!regex.test(String(itemVal || ''))) return false;
        continue;
      }
      if (val.$lt !== undefined) {
        const itemDate = new Date(itemVal);
        const targetDate = new Date(val.$lt);
        if (!(itemDate < targetDate)) return false;
        continue;
      }
      if (val.$gte !== undefined) {
        const itemDate = new Date(itemVal);
        const targetDate = new Date(val.$gte);
        if (!(itemDate >= targetDate)) return false;
        continue;
      }
      if (val.$exists !== undefined) {
        const exists = itemVal !== undefined && itemVal !== null;
        if (exists !== val.$exists) return false;
        continue;
      }
    }
    if (String(itemVal) !== String(val)) return false;
  }
  return true;
}

let cached = global._mongoClientPromise;
if (!cached) {
  cached = global._mongoClientPromise = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (MONGODB_URI) {
    try {
      if (cached.conn) return cached.conn;
      if (!cached.promise) {
        const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
        cached.promise = client.connect().then((c) => ({
          client: c,
          db: c.db(DB_NAME),
          isMongo: true,
        }));
      }
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (err) {
      console.warn('MongoDB connection failed, falling back to persistent local store:', err.message);
    }
  }

  // Graceful local fallback
  return {
    client: null,
    db: {
      collection: (name) => new LocalCollection(name),
    },
    isMongo: false,
  };
}

export async function getCollection(name) {
  const { db } = await connectToDatabase();
  return db.collection(name);
}

export async function initializeDatabase() {
  try {
    const { db, isMongo } = await connectToDatabase();
    if (isMongo) {
      const repos = db.collection('repos');
      await repos.createIndex({ fullName: 1 }, { unique: true }).catch(() => {});
      const issues = db.collection('issues');
      await issues.createIndex({ githubId: 1 }, { unique: true }).catch(() => {});
      await issues.createIndex({ repoFullName: 1, number: 1 }).catch(() => {});
      await issues.createIndex({ 'triage.category': 1 }).catch(() => {});
      await issues.createIndex({ 'triage.priority': 1 }).catch(() => {});
      const activities = db.collection('activities');
      await activities.createIndex({ createdAt: -1 }).catch(() => {});
    }
    return true;
  } catch (e) {
    return true;
  }
}
