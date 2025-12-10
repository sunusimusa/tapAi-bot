// helpers.js (or paste in top of app.js)
import { Low, JSONFile } from 'lowdb';
import path from 'path';
import fs from 'fs';

const DB_FILE = process.env.DB_FILE || path.join(process.cwd(), 'data', 'db.json');
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter);

export async function initDB() {
  await db.read();
  db.data ||= { users: {}, payments: [] };
  await db.write();
}

export async function getUser(id) {
  await db.read();
  db.data.users ||= {};
  if (!db.data.users[id]) {
    db.data.users[id] = {
      id,
      isPremium: false,
      premiumUntil: null,
      freeUsedToday: 0,
      freeResetAt: Date.now() + 24*60*60*1000,
      refs: 0
    };
    await db.write();
  }
  return db.data.users[id];
}

export async function saveUser(user) {
  db.data.users[user.id] = user;
  await db.write();
}

export async function addPayment(rec) {
  db.data.payments.push(rec);
  await db.write();
}
