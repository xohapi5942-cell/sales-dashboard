// Sales Dashboard ka data  <->  SQLite tables (sirf mapping)
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS items(
  id INTEGER PRIMARY KEY,
  co TEXT NOT NULL,
  name TEXT NOT NULL,
  nf TEXT,
  f TEXT,
  w TEXT,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS accounts(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS vals(
  acc TEXT,
  day TEXT,
  field TEXT NOT NULL,
  value TEXT,
  PRIMARY KEY(acc, day, field)
);
CREATE TABLE IF NOT EXISTS meta(
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

const TABLES = ['items', 'accounts', 'vals', 'meta'];

// Poora state -> SQL statements (ek transaction me chalenge)
export function toStatements(s) {
  const st = TABLES.map(t => ({ statement: 'DELETE FROM ' + t + ';', values: [] }));
  const add = (statement, values) => st.push({ statement, values });
  (s.items || []).forEach(x => add(
    'INSERT INTO items(id,co,name,nf,f,w,active) VALUES (?,?,?,?,?,?,?);',
    [x.id, x.co, x.name, String(x.nf == null ? '' : x.nf), String(x.f == null ? '' : x.f), String(x.w == null ? '' : x.w), x.active ? 1 : 0]));
  (s.accounts || []).forEach(x => add(
    'INSERT INTO accounts(id,name,active) VALUES (?,?,?);',
    [x.id, x.name, x.active ? 1 : 0]));
  const vals = s.vals || {};
  Object.keys(vals).forEach(k => {
    const v = vals[k];
    if (v === '' || v == null) return;            // khali value save nahi hoti
    const p = k.split('|');
    if (p.length === 3) add('INSERT OR REPLACE INTO vals(acc,day,field,value) VALUES (?,?,?,?);', [p[0], p[1], p[2], String(v)]);
    else add('INSERT OR REPLACE INTO vals(acc,day,field,value) VALUES (?,?,?,?);', ['', '', k, String(v)]);
  });
  add('INSERT INTO meta(key,value) VALUES (?,?);', ['nextId', String(s.nextId)]);
  add('INSERT INTO meta(key,value) VALUES (?,?);', ['aNextId', String(s.aNextId)]);
  add('INSERT INTO meta(key,value) VALUES (?,?);', ['defaultAcc', JSON.stringify(s.defaultAcc == null ? null : s.defaultAcc)]);
  add('INSERT INTO meta(key,value) VALUES (?,?);', ['payShow', JSON.stringify(s.payShow || [true, true, true, true, true, true])]);
  add('INSERT INTO meta(key,value) VALUES (?,?);', ['initialized', '1']);
  return st;
}

// Tables ki rows -> app ka state
export function fromRows(r) {
  const meta = {};
  r.meta.forEach(m => { meta[m.key] = m.value; });
  const items = r.items.map(x => ({ id: x.id, co: x.co, name: x.name, nf: x.nf || '', f: x.f || '', w: x.w || '', active: !!x.active }));
  const accounts = r.accounts.map(x => ({ id: x.id, name: x.name, active: !!x.active }));
  const vals = {};
  r.vals.forEach(x => { vals[x.acc === '' && x.day === '' ? x.field : x.acc + '|' + x.day + '|' + x.field] = x.value; });
  const j = (t, d) => { try { return t == null ? d : JSON.parse(t); } catch (e) { return d; } };
  return {
    items, accounts, vals,
    nextId: Number(meta.nextId || 1),
    aNextId: Number(meta.aNextId || 1),
    defaultAcc: j(meta.defaultAcc, null),
    payShow: j(meta.payShow, [true, true, true, true, true, true])
  };
}
