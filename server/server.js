const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { v4: uuidv4 } = require('uuid');
const { backendLogger } = require('./config/logger');

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : ["https://x-park.vercel.app", "https://x-park-jk5u.onrender.com", "http://localhost:5173","https://x-park-y0qe.onrender.com"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.br')) {
      res.setHeader('Content-Encoding', 'br');
      if (filePath.endsWith('.js.br')) res.setHeader('Content-Type', 'application/javascript');
      else if (filePath.endsWith('.wasm.br')) res.setHeader('Content-Type', 'application/wasm');
      else if (filePath.endsWith('.data.br')) res.setHeader('Content-Type', 'application/octet-stream');
    }
    else if (filePath.endsWith(".wasm")) res.setHeader("Content-Type", "application/wasm");
  }
}));

app.use(express.json());

app.use((req, res, next) => {
    const correlation_id = req.headers['x-correlation-id'] || uuidv4();
    req.correlation_id = correlation_id;
    res.setHeader('X-Correlation-ID', correlation_id);
    next();
});

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

        const message = `HTTP ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;

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

app.get('/', (req, res) => res.send('API is running...'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/games', require('./routes/game'));
app.use('/api/support', require('./routes/support'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/schools', require('./routes/school'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/log', require('./routes/log'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => backendLogger.success(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`, { context: 'ServerStartup' }));