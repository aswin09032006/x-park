const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const helmet = require('helmet'); // --- THIS IS THE FIX: Import Helmet

dotenv.config();
connectDB();

const app = express();


app.use(helmet());

// --- Updated CORS config ---
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : ["https://x-park.vercel.app", "https://x-park-jk5u.onrender.com", "http://localhost:5173","https://x-park-y0qe.onrender.com"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow mobile apps, curl, etc.
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false); // Reject without throwing
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.br')) {
      res.setHeader('Content-Encoding', 'br');
      // Set the correct MIME type based on the original file extension.
      if (filePath.endsWith('.js.br')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.wasm.br')) {
        res.setHeader('Content-Type', 'application/wasm');
      } else if (filePath.endsWith('.data.br')) {
        res.setHeader('Content-Type', 'application/octet-stream');
      }
    }
    // Fallback for any uncompressed wasm files.
    else if (filePath.endsWith(".wasm")) {
      res.setHeader("Content-Type", "application/wasm");
    }
  }
}));

// --------------------------------

app.use(express.json());

app.get('/', (req, res) => res.send('API is running...'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/games', require('./routes/game'));
app.use('/api/support', require('./routes/support'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/schools', require('./routes/school'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/dashboard', require('./routes/dashboard'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));