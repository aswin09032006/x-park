import { logger } from './logger';

const API_URL = import.meta.env.VITE_ENVIRONMENT === 'production' ? `${import.meta.env.VITE_BACKEND_PROD_URL}/api` : `${import.meta.env.VITE_BACKEND_LOCAL_URL}/api`;

export const publicApi = async (endpoint, method = 'GET', body = null) => {
    const context = `publicApi.${method}`;
    const correlation_id = logger.getCurrentCorrelationId();
    try {
        const config = {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'X-Correlation-ID': correlation_id
            },
        };

        if (body) config.body = JSON.stringify(body);

        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) throw new Error(data.msg || 'An API error occurred');
        return data;
    } catch (error) {
        logger.error(`Public API call failed: ${error.message}`, { context, details: { endpoint, error: { message: error.message } } });
        throw error;
    }
};

const refreshToken = async () => {
    const context = 'api.refreshToken';
    const correlation_id = logger.getCurrentCorrelationId();
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlation_id
        },
        body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    if (!response.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        throw new Error(data.msg || 'Session expired. Please log in again.');
    }

    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
};

export const api = async (endpoint, method = 'GET', body = null, isFormData = false) => {
    const context = `api.${method}`;
    let accessToken = localStorage.getItem('accessToken');
    
    const makeRequest = async (token) => {
        const correlation_id = logger.getCurrentCorrelationId();
        const config = { 
            method, 
            headers: { 'X-Correlation-ID': correlation_id } 
        };

        if (!isFormData) {
            config.headers['Content-Type'] = 'application/json';
            if (body) config.body = JSON.stringify(body);
        } else {
            if (body) config.body = body;
        }

        if (token) config.headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (response.status === 401 || response.status === 403) {
            try {
                logger.warn('Access token expired/invalid, attempting refresh.', { context, details: { endpoint } });
                const newAccessToken = await refreshToken();
                logger.success('Access token refreshed successfully.', { context });
                return makeRequest(newAccessToken); 
            } catch (refreshError) {
                logger.error('Token refresh failed, forcing logout.', { context, details: { error: { message: refreshError.message } } });
                const originalData = await response.json().catch(() => ({}));
                const error = new Error(originalData.msg || refreshError.message);
                error.data = originalData;
                throw error;
            }
        }
        
        const data = await response.json();
        if (!response.ok) {
            const error = new Error(data.msg || data.errors?.[0]?.msg || 'An API error occurred');
            error.data = data;
            throw error;
        }
        return data;
    };

    try {
        return await makeRequest(accessToken);
    } catch (error) {
        logger.error(`API call failed: ${error.message}`, { context, details: { endpoint, error: error.data || { message: error.message } } });
        throw error;
    }
};