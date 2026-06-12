import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDb } from '../db.js';
import authMiddleware from '../middleware/auth.js';
import dotenv from 'dotenv';
import { generateAIResponseFallback } from '../utils/aiFallback.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_token_here';

// Helper: Format DB user and interests into UI client format
async function formatUserResponse(dbUser, db) {
  const interestsRows = await db.all('SELECT interest_id FROM interests WHERE user_id = ?', [dbUser.id]);
  const interests = interestsRows.map(row => row.interest_id);
  
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    academic: {
      level: dbUser.academic_level,
      marks: dbUser.academic_marks ? String(dbUser.academic_marks) : '',
      stream: dbUser.academic_stream
    },
    interests: interests,
    careerGoal: dbUser.career_goal || '',
    preferences: {
      collegeType: dbUser.college_type,
      budget: dbUser.budget,
      location: dbUser.location
    },
    createdAt: dbUser.created_at
  };
}

// @route   POST /api/auth/signup
// @desc    Register a new user
router.post('/signup', async (req, res) => {
  const {
    name,
    email,
    password,
    academicLevel,
    academicMarks,
    academicStream,
    interests,
    careerGoal,
    preferredCollegeType,
    budget,
    location
  } = req.value || req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter all required fields.' });
  }

  try {
    const db = await getDb();

    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user ID
    const userId = crypto.randomUUID();

    // Insert user into DB
    await db.run(
      `INSERT INTO users (
        id, name, email, password_hash, academic_level, academic_marks, academic_stream, career_goal, college_type, budget, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        email.toLowerCase(),
        passwordHash,
        academicLevel || 'PUC',
        academicMarks ? parseFloat(academicMarks) : null,
        academicStream || 'Science',
        careerGoal || '',
        preferredCollegeType || 'Government',
        budget ? parseInt(budget) : 100000,
        location || ''
      ]
    );

    // Insert interests into DB
    if (interests && Array.isArray(interests)) {
      const stmt = await db.prepare('INSERT INTO interests (user_id, interest_id) VALUES (?, ?)');
      for (const interest of interests) {
        await stmt.run([userId, interest]);
      }
      await stmt.finalize();
    }

    // Get the newly created user details
    const newUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    const formattedUser = await formatUserResponse(newUser, db);

    // Generate JWT
    const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: formattedUser
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password.' });
  }

  try {
    const db = await getDb();

    // Fetch user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Check password match
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const formattedUser = await formatUserResponse(user, db);

    // Generate JWT
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: formattedUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// @route   GET /api/user/profile
// @desc    Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const formattedUser = await formatUserResponse(user, db);
    res.json(formattedUser);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  const {
    name,
    academicLevel,
    academicMarks,
    academicStream,
    interests,
    careerGoal,
    collegeType,
    budget,
    location
  } = req.body;

  try {
    const db = await getDb();

    // Verify user exists
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Update user info
    await db.run(
      `UPDATE users SET
        name = ?,
        academic_level = ?,
        academic_marks = ?,
        academic_stream = ?,
        career_goal = ?,
        college_type = ?,
        budget = ?,
        location = ?
      WHERE id = ?`,
      [
        name !== undefined ? name : user.name,
        academicLevel !== undefined ? academicLevel : user.academic_level,
        academicMarks !== undefined ? parseFloat(academicMarks) : user.academic_marks,
        academicStream !== undefined ? academicStream : user.academic_stream,
        careerGoal !== undefined ? careerGoal : user.career_goal,
        collegeType !== undefined ? collegeType : user.college_type,
        budget !== undefined ? parseInt(budget) : user.budget,
        location !== undefined ? location : user.location,
        req.user.id
      ]
    );

    // Update interests if provided
    if (interests && Array.isArray(interests)) {
      // Clear current interests
      await db.run('DELETE FROM interests WHERE user_id = ?', [req.user.id]);
      
      // Re-insert interests
      const stmt = await db.prepare('INSERT INTO interests (user_id, interest_id) VALUES (?, ?)');
      for (const interest of interests) {
        await stmt.run([req.user.id, interest]);
      }
      await stmt.finalize();
    }

    // Fetch updated user
    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const formattedUser = await formatUserResponse(updatedUser, db);

    res.json(formattedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

// @route   POST /api/ai/chat
// @desc    Call AI Mentor (Gemini API with fallback to local rule-based system)
router.post('/chat', authMiddleware, async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Please send a message.' });
  }

  try {
    const db = await getDb();
    const dbUser = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!dbUser) {
      return res.status(404).json({ error: 'User context not found.' });
    }
    const userProfile = await formatUserResponse(dbUser, db);

    const apiKey = process.env.AI_API_KEY;
    
    // Check if real API Key exists and is not a placeholder
    if (apiKey && apiKey !== 'your_ai_api_key_here') {
      try {
        console.log('[AI] Calling Gemini API for message:', message);
        // Prompt construction
        const interestsString = userProfile.interests.join(', ');
        const studentContext = `Student Profile:
- Name: ${userProfile.name}
- Academic Level: ${userProfile.academic.level} (${userProfile.academic.stream}, ${userProfile.academic.marks}%)
- Interests: ${interestsString}
- Goal: ${userProfile.careerGoal}
- Budget: INR ${userProfile.preferences.budget}/year
- Location: ${userProfile.preferences.location} (${userProfile.preferences.collegeType})`;

        const prompt = `As Nav, a friendly AI career mentor, please help this student. 
Respond ONLY with your mentor message. Do NOT include your internal planning, thoughts, or step-by-step reasoning in the output.

${studentContext}

Student says: "${message}"`;

        let model = process.env.AI_MODEL || 'gemma-4-31b-it';
        if (!model.startsWith('models/')) {
          model = `models/${model}`;
        }
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          // Find the first part that is NOT a thought
          const responsePart = parts.find(p => !p.thought) || parts[parts.length - 1];
          
          if (responsePart?.text) {
            return res.json({ response: responsePart.text });
          }
        }
        console.warn('[AI] Gemini API failed or returned unexpected payload, falling back to rule-based mentor response.');
      } catch (err) {
        console.error('[AI] Error calling Gemini API:', err.message);
      }
    }

    // Fallback logic (uses client-side identical rule-based responses, powered by backend)
    const reply = await generateAIResponseFallback(message, userProfile);
    res.json({ response: reply });
  } catch (err) {
    console.error('AI chat route error:', err);
    res.status(500).json({ error: 'Server error processing chat.' });
  }
});

export default router;
