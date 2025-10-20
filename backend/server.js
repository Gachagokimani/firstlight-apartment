import cors from "cors";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import api from './routes/api.js';
// server.js
import express from 'express';
import usersRouter from './routes/user.js';
import postsRouter from './routes/post.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Test Route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

// API Routes - use the imported api router
app.use('/api', api);

app.use(express.json());

// Route mounting - like assigning departments in a restaurant
app.use('/users/register', usersRouter); // All /users/register requests go to users.js
app.use('/api/auth', usersRouter);  // All /api/auth requests go to users.js
app.use('/api/auth/login', usersRouter);  // All /api/auth/login requests go to users.js
app.use('/users/login', usersRouter);    // All /users/login requests go to users.js
app.use('/api/users', usersRouter);   // All /api/users requests go to users.js
app.use('/api/posts', postsRouter);   // All /api/posts requests go to posts.js
app.use('/api/upload', postsRouter);   // All /api/upload requests go to posts.js
// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));