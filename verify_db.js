import sqlite3 from "sqlite3";
import path from "path";

const dbPath = "c:/sem 4/synesis/backend/database.sqlite";

console.log("Checking SQLite database at:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Could not connect to database:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to SQLite database.");
});

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
      console.error("❌ Error querying tables:", err.message);
      process.exit(1);
    }
    console.log("Tables found:", rows.map(r => r.name).join(", "));
    
    if (rows.some(r => r.name === 'transactions')) {
      db.get("SELECT COUNT(*) as count FROM transactions", (err, row) => {
        if (err) {
          console.error("❌ Error counting transactions:", err.message);
        } else {
          console.log(`📊 Transactions count: ${row.count}`);
        }
        db.close();
      });
    } else {
      console.warn("⚠️ 'transactions' table not found!");
      db.close();
    }
  });
});
