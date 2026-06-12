-- Schema Placeholder for NavGuide

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    academic_level TEXT,
    academic_marks REAL,
    academic_stream TEXT,
    career_goal TEXT,
    college_type TEXT,
    budget INTEGER,
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interests (
    user_id TEXT,
    interest_id TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    PRIMARY KEY(user_id, interest_id)
);

CREATE TABLE IF NOT EXISTS engineering_colleges (
    id INT PRIMARY KEY,
    college_name VARCHAR(255),
    location VARCHAR(100),
    college_type VARCHAR(50),
    naac_grade VARCHAR(10),
    top_course VARCHAR(255),
    total_fees INT,
    highest_package INT,
    rating DECIMAL(2,1),
    official_website_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    college_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id TEXT PRIMARY KEY,
    exam_alerts INTEGER DEFAULT 1,
    deadline_alerts INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    username TEXT,
    college_id INTEGER,
    rating REAL,
    comment TEXT,
    date TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS discussions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    username TEXT,
    title TEXT,
    content TEXT,
    date TEXT,
    category TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    username TEXT,
    discussion_id TEXT,
    content TEXT,
    date TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(discussion_id) REFERENCES discussions(id)
);

