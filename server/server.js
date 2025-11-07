// server.js (Production-Ready Version)

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet'); // 1. CRITICAL FOR SECURITY
const { v4: uuidv4 } = require('uuid');
const connectDB = require('./config/db');
const { backendLogger } = require('./config/logger'); // Assuming this is your Winston logger instance

// Load environment variables and connect to the database
dotenv.config();
connectDB();

const app = express();

// --- Middleware Chain (Correct Production Order) ---

// 1. Set essential security headers with Helmet
app.use(helmet());

// 2. Configure Cross-Origin Resource Sharing (CORS)
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : ["http://localhost:5173"]; // Safe fallback for local dev if env is missing

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('The CORS policy for this site does not allow access from your origin.'));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
}));

// 3. Body parser for JSON payloads
app.use(express.json());

// 4. Custom Middleware: Generate a Correlation ID for each request
app.use((req, res, next) => {
    const correlation_id = req.headers['x-correlation-id'] || uuidv4();
    req.correlation_id = correlation_id;
    res.setHeader('X-Correlation-ID', correlation_id);
    next();
});

// 5. Custom Middleware: Log incoming requests and their responses
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logDetails = {
            context: 'HttpRequest',
            correlation_id: req.correlation_id,
            details: {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration_ms: duration,
                ip: req.ip,
                userAgent: req.get('user-agent'),
            }
        };
        const message = `HTTP ${req.method} ${req.originalUrl} | ${res.statusCode} | ${duration}ms`;

        if (res.statusCode >= 500) {
            backendLogger.error(message, logDetails);
        } else if (res.statusCode >= 400) {
            backendLogger.warn(message, logDetails);
        } else {
            backendLogger.info(message, logDetails);
        }
    });
    next();
});

// 6. Serve static files from the 'public' directory (for game assets)
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.br')) {
      res.setHeader('Content-Encoding', 'br');
      if (filePath.endsWith('.js.br')) res.setHeader('Content-Type', 'application/javascript');
      else if (filePath.endsWith('.wasm.br')) res.setHeader('Content-Type', 'application/wasm');
      else if (filePath.endsWith('.data.br')) res.setHeader('Content-Type', 'application/octet-stream');
    } else if (filePath.endsWith(".wasm")) {
      res.setHeader("Content-Type", "application/wasm");
    }
  }
}));

// --- API Routes ---
app.get('/', (req, res) => res.send('API is running...'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/games', require('./routes/game'));
app.use('/api/support', require('./routes/support'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/schools', require('./routes/school'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/log', require('./routes/log')); // Assuming you have a log route


// --- Global Error Handler (MUST BE THE LAST MIDDLEWARE) ---
// This acts as a safety net to catch any unhandled errors in your routes.
app.use((err, req, res, next) => {
    // Log the error for debugging purposes using your structured logger
    backendLogger.error(`Unhandled Error: ${err.message}`, {
        context: 'ErrorHandler',
        correlation_id: req.correlation_id,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
    });

    // Send a generic, safe response to the client
    res.status(500).json({ 
        msg: 'An unexpected server error occurred. Our team has been notified.' 
    });
});


// --- Server Startup ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    // Use the standard .info() level for consistency
    backendLogger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`, { context: 'ServerStartup' });
});