const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, 'chat.db'), (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create messages table
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        user_id INTEGER,
        username TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
}

// User methods
const userMethods = {
    createUser: (username, password) => {
        return new Promise(async (resolve, reject) => {
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                db.run(
                    'INSERT INTO users (username, password) VALUES (?, ?)',
                    [username, hashedPassword],
                    function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({
                                id: this.lastID,
                                username
                            });
                        }
                    }
                );
            } catch (err) {
                reject(err);
            }
        });
    },

    findUser: (username) => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM users WHERE username = ?',
                [username],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }
};

// Message methods
const messageMethods = {
    saveMessage: (text, userId, username) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO messages (text, user_id, username) VALUES (?, ?, ?)',
                [text, userId, username],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            id: this.lastID,
                            text,
                            username,
                            created_at: new Date().toISOString()
                        });
                    }
                }
            );
        });
    },

    getRecentMessages: (limit = 50) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM messages ORDER BY created_at DESC LIMIT ?',
                [limit],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows.reverse());
                    }
                }
            );
        });
    }
};

module.exports = {
    db,
    userMethods,
    messageMethods
};