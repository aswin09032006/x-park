// server.js (Pino Version - Final)

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

// Env vars are preloaded with -r dotenv/config
const connectDB = require('./config/db');
const { backendLogger } = require('./config/logger');

dotenv.config();

// Connect to the database
connectDB();

const app = express();

// --- Middleware Chain ---
app.use(helmet());
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : ["http://localhost:5173"];
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
app.use(express.json());
app.use((req, res, next) => {
    req.correlation_id = req.headers['x-correlation-id'] || uuidv4();
    res.setHeader('X-Correlation-ID', req.correlation_id);
    next();
});

// HTTP Request Logger Middleware using Pino
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
            backendLogger.error({ msg: message, ...logDetails });
        } else if (res.statusCode >= 400) {
            backendLogger.warn({ msg: message, ...logDetails });
        } else {
            backendLogger.info({ msg: message, ...logDetails });
        }
    });
    next();
});

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
// The /api/log route is now removed

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    backendLogger.error({
        msg: `Unhandled Error: ${err.message}`,
        context: 'ErrorHandler',
        correlation_id: req.correlation_id,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
    });
    res.status(500).json({ msg: 'An unexpected server error occurred. Our team has been notified.' });
});

// --- Server Startup ---
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    backendLogger.info(`Server running in ${process.env.ENVIRONMENT} mode on port ${PORT}`, { context: 'ServerStartup' });
});

// --- Graceful Shutdown ---
const shutdown = (signal) => {
    backendLogger.warn(`Received ${signal}. Closing http server.`, { context: 'Shutdown' });
    server.close(() => {
        backendLogger.warn('Server closed. Pino will flush and exit.', { context: 'Shutdown' });
        process.exit(0);
    });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err, origin) => {
    backendLogger.fatal({
        msg: `UNCAUGHT EXCEPTION! Origin: ${origin}. Shutting down...`,
        context: 'UncaughtException',
        stack: err.stack,
        message: err.message
    });
    console.error('UNCAUGHT EXCEPTION! See logs for details. Shutting down...');
    process.exit(1);
});