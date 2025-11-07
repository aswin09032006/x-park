const winston = require('winston');
const path = require('path');

const logDir = 'logs';

// Sanitize sensitive information from logs
const sanitizeFormat = winston.format((info) => {
    const sensitiveKeys = ['password', 'token', 'refreshToken', 'accessToken', 'verificationCode', 'passwordResetToken', 'email'];
    
    const sanitize = (obj) => {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const newObj = Array.isArray(obj) ? [] : {};

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (sensitiveKeys.includes(key.toLowerCase())) {
                    newObj[key] = '*** MASKED ***';
                } else {
                    newObj[key] = sanitize(obj[key]);
                }
            }
        }
        return newObj;
    };

    return sanitize(info);
});

const createLogger = (logPath, serviceName) => {
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

    return winston.createLogger({
        levels: customLevels.levels,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
            sanitizeFormat(),
            winston.format.json()
        ),
        defaultMeta: { service: serviceName },
        transports: [
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
                filename: path.join(logPath, 'all.log'),
                ...fileTransportOptions
            })
        ],
        exitOnError: false
    });
};

const backendLogger = createLogger(path.join(logDir, 'backend'), 'backend-api');
const frontendLogger = createLogger(path.join(logDir, 'frontend'), 'frontend-ui');

const logWrapper = (loggerInstance) => ({
    log: (level, message, metadata = {}) => loggerInstance.log(level, message, { ...metadata }),
    error: (message, metadata = {}) => loggerInstance.error(message, { ...metadata }),
    warn: (message, metadata = {}) => loggerInstance.warn(message, { ...metadata }),
    info: (message, metadata = {}) => loggerInstance.info(message, { ...metadata }),
    success: (message, metadata = {}) => loggerInstance.success(message, { ...metadata }),
    debug: (message, metadata = {}) => loggerInstance.debug(message, { ...metadata }),
});

module.exports = {
    backendLogger: logWrapper(backendLogger),
    frontendLogger: logWrapper(frontendLogger)
};