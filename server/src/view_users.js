import { getDb, initDb } from './db.js';

async function run() {
  try {
    await initDb();
    const db = await getDb();
    
    let users = [];
    if (db.data && db.data.users) {
      users = db.data.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        academic_level: u.academic_level,
        academic_marks: u.academic_marks,
        location: u.location,
        created_at: u.created_at
      }));
    } else {
      users = await db.all('SELECT id, name, email, academic_level, academic_marks, location, created_at FROM users');
    }

    console.log('\n=================== USER ACCOUNTS IN DATABASE ===================');
    console.table(users);
    console.log('=================================================================\n');
  } catch (error) {
    console.error('Error reading database:', error);
  } finally {
    process.exit(0);
  }
}

run();
