const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = 'logs';

// Ensure the base log directory exists before doing anything else
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Sanitize sensitive information from logs
const sanitizeFormat = winston.format((info) => {
    const sensitiveKeys = ['password', 'token', 'refreshToken', 'accessToken', 'verificationCode', 'passwordResetToken', 'email'];
    
    const sanitize = (obj, visited = new WeakSet()) => {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (visited.has(obj)) {
            return '[Circular Reference]';
        }
        visited.add(obj);

        const newObj = Array.isArray(obj) ? [] : {};

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (sensitiveKeys.includes(key.toLowerCase())) {
                    newObj[key] = '*** MASKED ***';
                } else {
                    newObj[key] = sanitize(obj[key], visited);
                }
            }
        }
        return newObj;
    };

    return sanitize(info);
});

const createLogger = (logPath, serviceName) => {
    // Ensure the specific log path (e.g., 'logs/backend') exists
    if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
    }

    const customLevels = {
        levels: {
            error: 0,
            warn: 1,
            info: 2,
            success: 3,
            debug: 4
        },
        colors: {
            error: 'red',
            warn: 'yellow',
            info: 'blue',
            success: 'green',
            debug: 'grey'
        }
    };

    winston.addColors(customLevels.colors);

    // Common file transport options
    const fileTransportOptions = {
        maxsize: 20 * 1024 * 1024, // 20MB
        maxFiles: 5,
        tailable: true,
        zippedArchive: true,
    };

    const transports = [
        new winston.transports.File({
            level: 'error',
            filename: path.join(logPath, 'error.log'),
            ...fileTransportOptions
        }),
        new winston.transports.File({
            level: 'warn',
            filename: path.join(logPath, 'warning.log'),
            ...fileTransportOptions
        }),
        new winston.transports.File({
            level: 'success',
            filename: path.join(logPath, 'success.log'),
            ...fileTransportOptions
        }),
        new winston.transports.File({
            level: 'debug',
            filename: path.join(logPath, 'debug.log'),
            ...fileTransportOptions
        }),
        new winston.transports.File({
            filename: path.join(logPath, 'all.log'),
            ...fileTransportOptions
        })
    ];

    // Also print to console in non-production mode
    if (process.env.NODE_ENV !== 'production') {
        transports.push(
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.printf(({ level, message, timestamp, ...meta }) => {
                        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                        return `[${timestamp}] ${level}: ${message} ${metaStr}`;
                    })
                )
            })
        );
    }

    return winston.createLogger({
        levels: customLevels.levels,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
            sanitizeFormat(),
            winston.format.json()
        ),
        defaultMeta: { service: serviceName },
        transports,
        exitOnError: false
    });
};

const backendLogger = createLogger(path.join(logDir, 'backend'), 'backend-api');
const frontendLogger = createLogger(path.join(logDir, 'frontend'), 'frontend-ui');

// Wrapper to ensure consistent logging interface
const logWrapper = (loggerInstance) => ({
    log: (level, message, metadata = {}) => loggerInstance.log({ level, message, ...metadata }),
    error: (message, metadata = {}) => loggerInstance.log({ level: 'error', message, ...metadata }),
    warn: (message, metadata = {}) => loggerInstance.log({ level: 'warn', message, ...metadata }),
    info: (message, metadata = {}) => loggerInstance.log({ level: 'info', message, ...metadata }),
    success: (message, metadata = {}) => loggerInstance.log({ level: 'success', message, ...metadata }),
    debug: (message, metadata = {}) => loggerInstance.log({ level: 'debug', message, ...metadata }),
});

module.exports = {
    backendLogger: logWrapper(backendLogger),
    frontendLogger: logWrapper(frontendLogger)
};

// --- TEST LOGGER FUNCTIONALITY ---
// This runs only when you execute this file directly
if (require.main === module) {
    console.log('🧪 Testing logger output...');

    backendLogger.debug('Debug log test from backendLogger', { context: 'test', step: 1 });
    backendLogger.info('Info log test from backendLogger', { context: 'test', step: 2 });
    backendLogger.success('Success log test from backendLogger', { context: 'test', step: 3 });
    backendLogger.warn('Warning log test from backendLogger', { context: 'test', step: 4 });
    backendLogger.error('Error log test from backendLogger', { context: 'test', step: 5, password: 'secret123' });

    frontendLogger.debug('Debug log test from frontendLogger', { module: 'frontend', step: 1 });
    frontendLogger.info('Info log test from frontendLogger', { module: 'frontend', step: 2 });

    console.log('✅ Logger test messages written to /logs/backend and /logs/frontend');
}
