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
      engineering_colleges: [],
      bookmarks: [],
      notifications: [],
      notification_preferences: [],
      reviews: [],
      discussions: [],
      comments: []
    };
    this.load();
  }

  load() {
    if (fs.existsSync(mockDbPath)) {
      try {
        const loaded = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        this.data = {
          users: loaded.users || [],
          interests: loaded.interests || [],
          engineering_colleges: loaded.engineering_colleges || [],
          bookmarks: loaded.bookmarks || [],
          notifications: loaded.notifications || [],
          notification_preferences: loaded.notification_preferences || [],
          reviews: loaded.reviews || [],
          discussions: loaded.discussions || [],
          comments: loaded.comments || []
        };
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
          
          const [id, name, loc, type, naac, course, fees, pkg, rating, url] = values;
          mockDb.data.engineering_colleges.push({
            id: parseInt(id),
            college_name: name,
            location: loc,
            college_type: type,
            naac_grade: naac,
            top_course: course,
            total_fees: parseInt(fees),
            highest_package: parseInt(pkg),
            rating: parseFloat(rating),
            official_website_url: url === 'NULL' || !url ? null : url
          });
        }
      }
      mockDb.save();
      console.log(`[DB] Seeded ${mockDb.data.engineering_colleges.length} colleges.`);
    }
  }

  // Seed default users if empty or missing
  try {
    const defaultUsers = [
      {
        id: 'default-student-id',
        name: 'Nav Student',
        email: 'student@navguide.com',
        password_hash: '$2a$10$K6a3WaI9Al6Vq2Q4cWKBoOeRgTXsInGbvgxQUugIIvZeawEufYqtu',
        academic_level: 'PUC',
        academic_marks: 95.5,
        academic_stream: 'Science',
        career_goal: 'Software Engineer',
        college_type: 'Government',
        budget: 150000,
        location: 'Bangalore'
      },
      {
        id: 'sohan-pinto-id',
        name: 'Sohan Vikas Pinto',
        email: 'sohanpinto11@gmail.com',
        password_hash: '$2a$10$K6a3WaI9Al6Vq2Q4cWKBoOeRgTXsInGbvgxQUugIIvZeawEufYqtu',
        academic_level: 'PUC',
        academic_marks: 90.0,
        academic_stream: 'Science',
        career_goal: 'AI Developer',
        college_type: 'Private',
        budget: 300000,
        location: 'Mangalore'
      },
      {
        id: 'sreehari-user-id',
        name: 'Sreehari',
        email: 'sreehari2005@gmail.com',
        password_hash: '$2a$10$4dQObpfV/SOjWNSfP1XxtuVGwrUQKO1CnsfBp71Iauq0tyynBv3x2',
        academic_level: 'PUC',
        academic_marks: 95.0,
        academic_stream: 'Science',
        career_goal: 'AI Specialist',
        college_type: 'Government',
        budget: 200000,
        location: 'Bangalore'
      }
    ];

    let modified = false;
    for (const u of defaultUsers) {
      if (!mockDb.data.users.some(existing => existing.email.toLowerCase() === u.email.toLowerCase())) {
        console.log(`[DB] Seeding missing user: ${u.email}`);
        mockDb.data.users.push({
          ...u,
          created_at: new Date().toISOString()
        });
        
        mockDb.data.interests.push(
          { user_id: u.id, interest_id: 'coding' },
          { user_id: u.id, interest_id: 'ai' }
        );
        modified = true;
      }
    }

    if (modified) {
      mockDb.save();
      console.log('[DB] Default users seeded successfully.');
    } else {
      console.log('[DB] Default users already present.');
    }

    // Seed default notifications
    if (!mockDb.data.notifications || mockDb.data.notifications.length === 0) {
      console.log('[DB] Seeding default notifications...');
      mockDb.data.notifications = [
        {
          id: 'notif-1',
          title: 'JEE Main 2026 Registration Open',
          description: 'Registration for JEE Main 2026 Phase 1 is now open. Last date to apply is Nov 30, 2025.',
          date: new Date().toISOString(),
          read: false,
          type: 'exam'
        },
        {
          id: 'notif-2',
          title: 'KCET Counseling Option Entry',
          description: 'The option entry for KCET Mock allotment begins tomorrow. Verify your colleges.',
          date: new Date().toISOString(),
          read: false,
          type: 'counseling'
        },
        {
          id: 'notif-3',
          title: 'BITSAT Application Deadline',
          description: 'Reminder: BITSAT 2026 session 1 applications close in 5 days.',
          date: new Date().toISOString(),
          read: false,
          type: 'deadline'
        }
      ];
      modified = true;
    }

    // Seed default user notification preferences
    if (!mockDb.data.notification_preferences || mockDb.data.notification_preferences.length === 0) {
      mockDb.data.notification_preferences = [
        { user_id: 'default-student-id', exam_alerts: true, deadline_alerts: true },
        { user_id: 'sohan-pinto-id', exam_alerts: true, deadline_alerts: true },
        { user_id: 'sreehari-user-id', exam_alerts: true, deadline_alerts: true }
      ];
      modified = true;
    }

    // Seed default discussions and comments
    if (!mockDb.data.discussions || mockDb.data.discussions.length === 0) {
      console.log('[DB] Seeding default discussions...');
      mockDb.data.discussions = [
        {
          id: 'disc-1',
          user_id: 'default-student-id',
          username: 'Nav Student',
          title: 'Is NITK Surathkal CSE better than IIIT Bangalore CSE?',
          content: 'Hey guys, I have got a rank that allows me to get into both NITK Surathkal CSE and IIITB CSE. Can anyone share insights on placements, campus life, and peer group comparison?',
          date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
          category: 'Colleges'
        },
        {
          id: 'disc-2',
          user_id: 'sohan-pinto-id',
          username: 'Sohan Vikas Pinto',
          title: 'KCET 2026 Preparation Tips & Resources',
          content: 'What books are you guys using for KCET Math and Physics? Is HC Verma sufficient for Physics?',
          date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          category: 'Exams'
        }
      ];
      mockDb.data.comments = [
        {
          id: 'comm-1',
          user_id: 'sohan-pinto-id',
          username: 'Sohan Vikas Pinto',
          discussion_id: 'disc-1',
          content: 'NITK has a huge campus and amazing beach, plus lower fees since it is Government. IIITB is great for coding culture but very academic-centric. Go for NITK!',
          date: new Date(Date.now() - 86400000 * 1.5).toISOString()
        }
      ];
      modified = true;
    }

    if (modified) {
      mockDb.save();
    }
  } catch (error) {
    console.error('[DB] Error during user seeding:', error.message);
  }
  
  return mockDb;
}
