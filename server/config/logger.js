// --- /backend/config/logger.js ---
const pino = require('pino');
const multistream = require('pino-multi-stream').multistream;
const path = require('path');
const fs = require('fs');
const pinoPretty = require('pino-pretty');

const logDir = 'logs';

// --- Setup ---
try {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
} catch (err) {
    console.error('[Logger Setup] CRITICAL: Failed to create base log directory.', err);
    process.exit(1);
}

const backendLogPath = path.join(logDir, 'backend');
const isProduction = process.env.NODE_ENV?.trim() === 'production';

console.log(`[Logger Setup] Environment detected: '${process.env.NODE_ENV?.trim()}'. Production mode: ${isProduction}`);

// --- THIS IS THE FIX: Reconfigured streams for proper splitting and context ---
function createStreams() {
    try {
        if (!fs.existsSync(backendLogPath)) {
            fs.mkdirSync(backendLogPath, { recursive: true });
        }
    } catch (err) {
        console.error(`[Logger Setup] CRITICAL: Failed to create log directory at ${backendLogPath}.`, err);
        process.exit(1);
    }

    // New, simplified stream configuration
    const streams = [
        // Stream 1: Captures ONLY 'error' level logs and sends them to error.log
        { level: 'error', stream: fs.createWriteStream(path.join(backendLogPath, 'error.log'), { flags: 'a' }) },
        
        // Stream 2: Captures 'info' and all levels above it (info, success, warn, error)
        // This provides a complete log for context.
        { level: 'info', stream: fs.createWriteStream(path.join(backendLogPath, 'combined.log'), { flags: 'a' }) }
    ];

    if (!isProduction) {
        // In development, add a pretty stream to the console for all 'info' and higher logs.
        streams.push({
            level: 'info',
            stream: pinoPretty({
                colorize: true,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                ignore: 'pid,hostname,service',
            })
        });
        console.log(`[Logger Setup] Development transport configured for Console, error.log, and combined.log`);
    } else {
        console.log(`[Logger Setup] Production transport configured for error.log and combined.log`);
    }

    return streams;
}

// --- Logger Definition ---
const customLevels = {
    success: 35
};

const backendPinoLogger = pino({
    level: 'info', // This is the minimum level that will be processed by any stream
    customLevels,
    redact: {
        paths: ['details.password', 'details.token', 'refreshToken', 'accessToken', 'email'],
        censor: '*** MASKED ***',
    },
    base: { service: 'backend-api' },
}, multistream(createStreams()));


// --- Wrapper to handle the custom 'success' level ---
const createLoggerWrapper = (loggerInstance) => {
    const wrapper = {};
    const levels = ['info', 'warn', 'error', 'debug', 'fatal', 'success'];

    levels.forEach(level => {
        wrapper[level] = (objOrMsg, ...args) => {
            if (typeof objOrMsg === 'string') {
                loggerInstance[level]({ msg: objOrMsg }, ...args);
            } else {
                loggerInstance[level](objOrMsg, ...args);
            }
        };
    });
    return wrapper;
};

module.exports = {
    backendLogger: createLoggerWrapper(backendPinoLogger),
};