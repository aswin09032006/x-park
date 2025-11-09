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
const isProduction = process.env.ENVIRONMENT?.trim() === 'production';

console.log(`[Logger Setup] Environment detected: '${process.env.ENVIRONMENT?.trim()}'. Production mode: ${isProduction}`);

// --- Create Streams ---
function createStreams() {
    try {
        if (!fs.existsSync(backendLogPath)) {
            fs.mkdirSync(backendLogPath, { recursive: true });
        }
    } catch (err) {
        console.error(`[Logger Setup] CRITICAL: Failed to create log directory at ${backendLogPath}.`, err);
        process.exit(1);
    }

    // Base streams for writing to separate files
    const streams = [
        { level: 'error', stream: fs.createWriteStream(path.join(backendLogPath, 'error.log'), { flags: 'a' }) },
        { level: 'warn', stream: fs.createWriteStream(path.join(backendLogPath, 'warning.log'), { flags: 'a' }) },
        { level: 'success', stream: fs.createWriteStream(path.join(backendLogPath, 'success.log'), { flags: 'a' }) },
        { level: 'info', stream: fs.createWriteStream(path.join(backendLogPath, 'all.log'), { flags: 'a' }) }
    ];

    if (!isProduction) {
        // In development, add a pretty stream for the console
        streams.push({
            level: 'info',
            stream: pinoPretty({
                colorize: true,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                ignore: 'pid,hostname,service',
            })
        });
        console.log(`[Logger Setup] Development transport configured for Console & ${backendLogPath}`);
    } else {
        console.log(`[Logger Setup] Production transport configured for ${backendLogPath}`);
    }

    return streams;
}

// --- Logger Definition ---
const customLevels = {
    success: 35
};

const backendPinoLogger = pino({
    level: 'info', // This is the minimum level that will be processed
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