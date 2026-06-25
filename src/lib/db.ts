import type { QSLCard } from "../types";

function rowToCard(row: Record<string, unknown>): QSLCard {
  return {
    id: row.id as number,
    call: row.call as string,
    date: row.date as string,
    time: row.time as string,
    freq: row.freq as string,
    mode: row.mode as string,
    sent_status: row.sent_status as string,
    sent_method: row.sent_method as string,
    sent_date: (row.sent_date as string) || "",
    rcvd_status: row.rcvd_status as string,
    rcvd_date: (row.rcvd_date as string) || "",
    note: (row.note as string) || "",
    created_at: row.created_at as string,
  };
}

export function initSchema(db: D1Database) {
  return db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS qsl_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        call TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        freq TEXT DEFAULT '',
        mode TEXT DEFAULT '',
        sent_status TEXT DEFAULT '待寄',
        sent_method TEXT DEFAULT '',
        sent_date TEXT DEFAULT '',
        rcvd_status TEXT DEFAULT '待收',
        rcvd_date TEXT DEFAULT '',
        note TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_qsl_call ON qsl_cards(call)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_qsl_date ON qsl_cards(date)
    `),
  ]);
}

export function countCards(db: D1Database, filters?: Record<string, string | undefined>) {
  const { sql, params } = buildFilter("SELECT COUNT(*) as cnt FROM qsl_cards", filters);
  return db.prepare(sql).bind(...params).first<{ cnt: number }>();
}

export function queryCards(db: D1Database, filters?: Record<string, string | undefined>, limit?: number, offset?: number) {
  const { sql, params } = buildFilter("SELECT * FROM qsl_cards", filters);
  let full = `${sql} ORDER BY date DESC, time DESC`;
  if (limit != null) full += ` LIMIT ?`;
  if (offset != null) full += ` OFFSET ?`;
  const allParams = limit != null ? (offset != null ? [...params, limit, offset] : [...params, limit]) : params;
  return db.prepare(full).bind(...allParams).all<Record<string, unknown>>().then(r => r.results.map(rowToCard));
}

export function countBySentStatus(db: D1Database, status: string) {
  return db.prepare("SELECT COUNT(*) as cnt FROM qsl_cards WHERE sent_status = ?").bind(status).first<{ cnt: number }>();
}

export function countByRcvdStatus(db: D1Database, status: string) {
  return db.prepare("SELECT COUNT(*) as cnt FROM qsl_cards WHERE rcvd_status = ?").bind(status).first<{ cnt: number }>();
}

export function insertCard(db: D1Database, card: Omit<QSLCard, "id" | "created_at">) {
  return db.prepare(`
    INSERT INTO qsl_cards (call, date, time, freq, mode, sent_status, sent_method, sent_date, rcvd_status, rcvd_date, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(card.call, card.date, card.time, card.freq, card.mode,
    card.sent_status, card.sent_method, card.sent_date,
    card.rcvd_status, card.rcvd_date, card.note).run();
}

export function updateCard(db: D1Database, id: number, fields: Partial<QSLCard>) {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (k === "id" || k === "created_at") continue;
    sets.push(`${k} = ?`);
    params.push(v);
  }
  if (sets.length === 0) return Promise.resolve();
  params.push(id);
  return db.prepare(`UPDATE qsl_cards SET ${sets.join(", ")} WHERE id = ?`).bind(...params).run();
}

export function deleteCard(db: D1Database, id: number) {
  return db.prepare("DELETE FROM qsl_cards WHERE id = ?").bind(id).run();
}

export function deleteCards(db: D1Database, ids: number[]) {
  const ph = ids.map(() => "?").join(",");
  return db.prepare(`DELETE FROM qsl_cards WHERE id IN (${ph})`).bind(...ids).run();
}

function buildFilter(baseSQL: string, filters?: Record<string, string | undefined>) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filters?.call) { clauses.push("call LIKE ?"); params.push(`%${filters.call}%`); }
  if (filters?.sent_status) { clauses.push("sent_status = ?"); params.push(filters.sent_status); }
  if (filters?.rcvd_status) { clauses.push("rcvd_status = ?"); params.push(filters.rcvd_status); }
  if (filters?.date) { clauses.push("date LIKE ?"); params.push(`${filters.date}%`); }
  const sql = clauses.length > 0 ? `${baseSQL} WHERE ${clauses.join(" AND ")}` : baseSQL;
  return { sql, params };
}
