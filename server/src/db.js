import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');
const mockDbPath = path.resolve(projectRoot, 'database/navguide_mock.json');

// Ensure database directory exists
if (!fs.existsSync(path.dirname(mockDbPath))) {
  fs.mkdirSync(path.dirname(mockDbPath), { recursive: true });
}

class MockDB {
  constructor() {
    this.data = {
      users: [],
      interests: [],
      engineering_colleges: []
    };
    this.load();
  }

  load() {
    if (fs.existsSync(mockDbPath)) {
      try {
        this.data = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
      } catch (e) {
        console.error('[MockDB] Error loading data:', e);
      }
    }
  }

  save() {
    fs.writeFileSync(mockDbPath, JSON.stringify(this.data, null, 2));
  }

  async exec(sql) {
    // Simple schema/seed parser - very basic
    console.log('[MockDB] Executing SQL (Mocked):', sql.substring(0, 50) + '...');
    // We don't actually parse the SQL, we just assume it's for schema/seed
    // The seed data is handled in initDb by reading seed.sql if needed
  }

  async get(sql, params = []) {
    // Simple pattern matching for common queries
    if (sql.includes('SELECT * FROM users WHERE id = ?')) {
      return this.data.users.find(u => u.id === params[0]) || null;
    }
    if (sql.includes('SELECT * FROM users WHERE email = ?')) {
      return this.data.users.find(u => u.email === params[0]) || null;
    }
    if (sql.includes('SELECT COUNT(*) as count FROM engineering_colleges')) {
      return { count: this.data.engineering_colleges.length };
    }
    console.warn('[MockDB] Unsupported GET query:', sql, params);
    return null;
  }

  async all(sql, params = []) {
    if (sql.includes('SELECT interest_id FROM interests WHERE user_id = ?')) {
      return this.data.interests
        .filter(i => i.user_id === params[0])
        .map(i => ({ interest_id: i.interest_id }));
    }
    if (sql.includes('SELECT * FROM engineering_colleges')) {
      return this.data.engineering_colleges;
    }
    console.warn('[MockDB] Unsupported ALL query:', sql, params);
    return [];
  }

  async run(sql, params = []) {
    if (sql.includes('INSERT INTO users')) {
      // INSERT INTO users (id, name, email, password_hash, academic_level, academic_marks, academic_stream, career_goal, college_type, budget, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      const [id, name, email, password_hash, level, marks, stream, career, type, budget, loc] = params;
      const newUser = { id, name, email, password_hash, academic_level: level, academic_marks: marks, academic_stream: stream, career_goal: career, college_type: type, budget, location: loc };
      this.data.users.push(newUser);
      this.save();
      return { lastID: id };
    }
    if (sql.includes('UPDATE users SET')) {
      const userId = params[params.length - 1];
      const index = this.data.users.findIndex(u => u.id === userId);
      if (index !== -1) {
        // This is a simplified update, assumes parameters match the order in auth.js
        const [name, level, marks, stream, career, type, budget, loc] = params;
        this.data.users[index] = { ...this.data.users[index], name, academic_level: level, academic_marks: marks, academic_stream: stream, career_goal: career, college_type: type, budget, location: loc };
        this.save();
      }
      return { changes: 1 };
    }
    if (sql.includes('DELETE FROM interests WHERE user_id = ?')) {
      this.data.interests = this.data.interests.filter(i => i.user_id !== params[0]);
      this.save();
      return { changes: 1 };
    }
    console.warn('[MockDB] Unsupported RUN query:', sql, params);
    return { changes: 0 };
  }

  async prepare(sql) {
    const db = this;
    return {
      async run(params) {
        if (sql.includes('INSERT INTO interests')) {
          const [user_id, interest_id] = params;
          db.data.interests.push({ user_id, interest_id });
          db.save();
        }
      },
      async finalize() {
        db.save();
      }
    };
  }
}

const mockDb = new MockDB();

export async function getDb() {
  return mockDb;
}

export async function initDb() {
  console.log('[DB] Using JSON Mock Database for Termux compatibility.');
  
  // Load seed data if colleges are empty
  if (mockDb.data.engineering_colleges.length === 0) {
    const seedPath = path.resolve(projectRoot, 'database/seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('[DB] Seeding engineering colleges from seed.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      
      // Better parser for INSERT INTO engineering_colleges
      const insertMatch = seedSql.match(/INSERT INTO engineering_colleges .*? VALUES(.*?);/is);
      if (insertMatch) {
        const valuesBlob = insertMatch[1].trim();
        // Split by ),( to get rows, while being careful about internal commas
        const rows = valuesBlob.split(/\),\s*\(/s);
        for (let row of rows) {
          row = row.replace(/^\(|\)$/g, ''); // Clean outer parens
          // Split by comma, but handle quoted strings with escaped characters or internal commas (basic)
          const values = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === "'" && row[i-1] !== "\\") inQuotes = !inQuotes;
            if (char === ',' && !inQuotes) {
              values.push(current.trim().replace(/^'|'$/g, '').replace(/''/g, "'"));
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim().replace(/^'|'$/g, '').replace(/''/g, "'"));
          
          const [id, name, loc, type, naac, course, fees, pkg, rating] = values;
          mockDb.data.engineering_colleges.push({
            id: parseInt(id),
            college_name: name,
            location: loc,
            college_type: type,
            naac_grade: naac,
            top_course: course,
            total_fees: parseInt(fees),
            highest_package: parseInt(pkg),
            rating: parseFloat(rating)
          });
        }
      }
      mockDb.save();
      console.log(`[DB] Seeded ${mockDb.data.engineering_colleges.length} colleges.`);
    }
  }
  
  return mockDb;
}
