import sqlite3
import datetime

def init_db():
    """Initializes the database and creates the 'history' table if it doesn't exist."""
    conn = sqlite3.connect('symptom_checker.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symptoms TEXT NOT NULL,
            response TEXT NOT NULL,
            timestamp DATETIME NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def log_query(symptoms, response):
    """Logs a user's symptom query and the LLM's response to the database."""
    conn = sqlite3.connect('symptom_checker.db')
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO history (symptoms, response, timestamp) VALUES (?, ?, ?)",
        (symptoms, response, datetime.datetime.now())
    )
    conn.commit()
    conn.close()

