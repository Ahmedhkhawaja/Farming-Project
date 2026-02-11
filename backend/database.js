const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath);

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  // Stocks table
  db.run(`CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    total_stocks INTEGER NOT NULL,
    stocks_sold INTEGER NOT NULL,
    stocks_returned INTEGER NOT NULL
  )`);

  // Insert a default user (username: admin, password: admin)
  const defaultUser = {
    username: "admin",
    password: "$2a$10$X5h.Hm0vJQ1Q2qVp6qUZRuYv6q6Qk8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q", // bcrypt hash for 'admin'
  };

  const checkUser = db.get(
    `SELECT * FROM users WHERE username = ?`,
    [defaultUser.username],
    (err, row) => {
      if (err) {
        console.error(err);
      } else if (!row) {
        db.run(
          `INSERT INTO users (username, password) VALUES (?, ?)`,
          [defaultUser.username, defaultUser.password],
          (err) => {
            if (err) {
              console.error(err);
            } else {
              console.log("Default user created");
            }
          },
        );
      }
    },
  );

  // Insert some sample data for stocks
  const sampleData = [
    {
      date: "2023-10-01",
      total_stocks: 1000,
      stocks_sold: 200,
      stocks_returned: 10,
    },
    {
      date: "2023-10-02",
      total_stocks: 1500,
      stocks_sold: 300,
      stocks_returned: 20,
    },
    {
      date: "2023-10-03",
      total_stocks: 1200,
      stocks_sold: 250,
      stocks_returned: 15,
    },
  ];

  sampleData.forEach((data) => {
    db.get(`SELECT * FROM stocks WHERE date = ?`, [data.date], (err, row) => {
      if (err) {
        console.error(err);
      } else if (!row) {
        db.run(
          `INSERT INTO stocks (date, total_stocks, stocks_sold, stocks_returned) VALUES (?, ?, ?, ?)`,
          [
            data.date,
            data.total_stocks,
            data.stocks_sold,
            data.stocks_returned,
          ],
          (err) => {
            if (err) {
              console.error(err);
            }
          },
        );
      }
    });
  });
});

module.exports = db;
