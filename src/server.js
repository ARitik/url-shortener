import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import expressSession from 'express-session';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware.js';
import { authMiddleware } from './middleware/authMiddleware.js';

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
dotenv.config();

mongoose.connect(process.env.MONGODB_URI);


const UrlMapping = mongoose.model('UrlMapping', {
  longUrl: String,
  shortUrl: String,
  userId: String,
});

const User = mongoose.model('User', {
  email: String,
  password: String,
  tier: String,
});

const SECRET_KEY = process.env.SECRET_KEY;

app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);


/**
 * Registers a new user in the system.
 * @param {Object} req - The request object containing user details.
 * @param {Object} res - The response object.
 */
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, tier } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password with a salt round of 10
    const user = new User({ email, password: hashedPassword, tier });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handles user login, creating and sending a JWT token on success.
 * @param {Object} req - The request object with email and password.
 * @param {Object} res - The response object.
 */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password); // Compare the provided password with the hashed password
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, tier: user.tier }, SECRET_KEY);
    res.cookie('token', token);
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/user', authMiddleware);

/**
 * Creates a new shortened URL.
 * @param {Object} req - The request object containing the long URL and optional preferred short URL.
 * @param {Object} res - The response object.
 */
app.post('/api/user/shorten', rateLimitMiddleware, async (req, res) => {
  try {
    const { longUrl, preferredShortUrl } = req.body;
    const userId = req.userId;

    let shortUrl = preferredShortUrl;

    if (shortUrl) {
      const existingUrl = await UrlMapping.findOne({ shortUrl });
      if (existingUrl) {
        return res.status(409).json({ error: 'Short URL already exists' });
      }
    } else {
      shortUrl = generateRandomShortUrl();

      let existingUrl = await UrlMapping.findOne({ shortUrl });
      while (existingUrl) {
        shortUrl = generateRandomShortUrl();
        existingUrl = await UrlMapping.findOne({ shortUrl });
      }
    }

    const urlMapping = new UrlMapping({ longUrl, shortUrl, userId });
    await urlMapping.save();

    res.status(201).json({ shortUrl });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * Retrieves all shortened URLs created by a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('/api/user/shortened-urls', async (req, res) => {
  try {
    const userId = req.userId;
    const urls = await UrlMapping.find({ userId });
    res.status(200).json(urls);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Redirects a short URL to its original long URL.
 * @param {Object} req - The request object containing the short URL.
 * @param {Object} res - The response object.
 */
app.get('/:shortUrl', async (req, res) => {
  try {
    const shortUrl = req.params.shortUrl;
    const urlMapping = await UrlMapping.findOne({ shortUrl });

    if (!urlMapping) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    res.redirect(301, urlMapping.longUrl);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

/**
 * Generates a random short URL.
 * @return {String} A randomly generated short URL.
 */
function generateRandomShortUrl() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let shortUrl = '';
  for (let i = 0; i < 6; i++) {
    shortUrl += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return shortUrl;
}
