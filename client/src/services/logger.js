import { v4 as uuidv4 } from 'uuid';

let correlationId = uuidv4();

const logEndpoint = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/log` : '/api/log';

const sendLog = (logData) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    const payload = JSON.stringify(logData);
    
    try {
        if (navigator.sendBeacon) {
            navigator.sendBeacon(logEndpoint, new Blob([payload], { type: 'application/json' }));
        } else {
            fetch(logEndpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: payload,
                keepalive: true,
            }).catch(err => {
                 // --- THIS IS THE FIX: More descriptive error for easier debugging ---
                console.error(
                    `[Logger Error] Failed to send log to the backend endpoint (${logEndpoint}). ` +
                    `Please check: \n` +
                    `1. Your VITE_API_URL in the .env file is correct. \n` +
                    `2. The backend server is running and accessible. \n` +
                    `3. There are no network or CORS issues. \n`,
                    err
                );
            });
        }
    } catch (error) {
        console.error("Logger failed to send log to server:", error);
    }
};

// This function will log to the console only in development mode.
const log = (level, message, context, details = {}) => {
    // In production, this function does nothing.
    if (import.meta.env.VITE_ENVIRONMENT !== 'development') {
        return;
    }

    const style = 'font-weight: bold;';
    const consoleMessage = `%c[${level.toUpperCase()}]%c [${context}] ${message}`;
    // Use the inner 'details' object if it exists, otherwise use the whole object.
    const detailsToLog = details.details || details;

    switch (level) {
        case 'success':
            console.info(consoleMessage, `color: green; ${style}`, 'color: unset;', detailsToLog);
            break;
        case 'info':
            console.info(consoleMessage, `color: blue; ${style}`, 'color: unset;', detailsToLog);
            break;
        case 'warn':
            console.warn(consoleMessage, `color: orange; ${style}`, 'color: unset;', detailsToLog);
            break;
        case 'error':
            console.error(consoleMessage, `color: red; ${style}`, 'color: unset;', detailsToLog);
            break;
        default:
            console.log(consoleMessage, `color: gray; ${style}`, 'color: unset;', detailsToLog);
    }
};

export const logger = {
    // Correlation ID functions are no longer needed for frontend.
    startNewTrace: () => {},
    getCurrentCorrelationId: () => '',

    success: (message, { context = 'General', ...details } = {}) => {
        log('success', message, context, details);
    },
    info: (message, { context = 'General', ...details } = {}) => {
        log('info', message, context, details);
    },
    warn: (message, { context = 'General', ...details } = {}) => {
        log('warn', message, context, details);
    },
    error: (message, { context = 'General', ...details } = {}) => {
        if (details.error instanceof Error) {
            details.error = {
                message: details.error.message,
                stack: details.error.stack,
            };
        }
        log('error', message, context, details);
    },
};