import { getDb, initDb } from './db.js';

async function run() {
  try {
    await initDb();
    const db = await getDb();
    const users = await db.all('SELECT id, name, email, academic_level, academic_marks, location, created_at FROM users');
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
