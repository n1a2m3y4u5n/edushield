import Database from 'better-sqlite3';
import path from 'path';

// DB 파일 경로 (프로젝트 루트)
const DB_PATH = path.join(process.cwd(), 'edushield.db');

let db: Database.Database | null = null;

// 싱글톤 DB 연결 반환
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

// 스키마 초기화 — spec 정의 그대로
function initializeSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      content           TEXT    NOT NULL,
      language          TEXT    DEFAULT 'ko',
      translated_content TEXT,
      type              TEXT,
      reason            TEXT,
      response          TEXT,
      emotion           TEXT,
      emotion_score     REAL,
      is_violence_risk  INTEGER DEFAULT 0,
      teacher_query     TEXT,
      teacher_response  TEXT,
      neis_data         TEXT,
      status            TEXT    DEFAULT 'pending',
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_reports (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      content     TEXT    NOT NULL,
      category    TEXT,
      urgency     TEXT,
      ai_summary  TEXT,
      status      TEXT    DEFAULT 'pending',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teacher_notifications (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER,
      type         TEXT,
      summary      TEXT,
      query        TEXT,
      is_read      INTEGER DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS preemptive_alerts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      trigger_type TEXT,
      message      TEXT,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
