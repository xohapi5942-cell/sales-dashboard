// SQLite se connection (Capacitor SQLite plugin). Android par asli SQLite database file banti hai.
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { SCHEMA, toStatements, fromRows } from './dbmap.js';

const DB_NAME = 'sales_dashboard';
let db = null;
let chain = Promise.resolve();

async function init() {
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const consistent = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;
  if (consistent.result && isConn) db = await sqlite.retrieveConnection(DB_NAME, false);
  else db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
  await db.open();
  await db.execute(SCHEMA);   // tables pehli dafa khud ban jate hain
}

async function rows(sql) {
  const r = await db.query(sql);
  return r.values || [];
}

// Pehli dafa (database khali) null deta hai
async function load() {
  const meta = await rows('SELECT key, value FROM meta');
  if (!meta.some(m => m.key === 'initialized')) return null;
  return fromRows({
    items: await rows('SELECT * FROM items ORDER BY id'),
    accounts: await rows('SELECT * FROM accounts ORDER BY id'),
    vals: await rows('SELECT * FROM vals'),
    meta
  });
}

// Saves line me chalte hain taake aapas me na takrayen
function save(state) {
  const run = () => db.executeSet(toStatements(state), true);   // true = ek transaction
  chain = chain.catch(() => {}).then(run);
  return chain;
}

window.SalesDb = { init, load, save };

// Voice input (remarks ke mic button ke liye): phone ka speech recognizer kholta hai
window.SalesVoice = {
  listen: async function () {
    const a = await SpeechRecognition.available();
    if (!a.available) throw new Error('Is phone me voice input available nahi hai.');
    const p = await SpeechRecognition.requestPermissions();
    if (p.speechRecognition !== 'granted') throw new Error('Microphone ki ijazat nahi mili.');
    const r = await SpeechRecognition.start({ maxResults: 1, prompt: 'Remarks bolein', popup: true, partialResults: false });
    return (r.matches && r.matches[0]) || '';
  }
};
