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
            }).catch(err => console.error("Logger fetch fallback failed:", err));
        }
    } catch (error) {
        console.error("Logger failed to send log to server:", error);
    }
};

const log = (level, message, context, details = {}) => {
    const logData = {
        level,
        message,
        context,
        correlation_id: correlationId,
        details,
        timestamp: new Date().toISOString(),
        url: window.location.href,
    };
    sendLog(logData);
};

export const logger = {
    startNewTrace: () => {
        correlationId = uuidv4();
    },
    getCurrentCorrelationId: () => {
        return correlationId;
    },
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