const API_URL = 'http://localhost:5000/api';

// --- NEW: A dedicated function for public (unauthenticated) API calls ---
export const publicApi = async (endpoint, method = 'GET', body = null) => {
    try {
        const config = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        // If the response is not OK, throw an error with the message from the backend
        if (!response.ok) {
            throw new Error(data.msg || 'An API error occurred');
        }

        return data;
    } catch (error) {
        console.error('Public API call failed:', error.message);
        throw error; // Re-throw the error to be caught by the component
    }
};


// --- THIS FUNCTION IS FOR AUTHENTICATED CALLS ONLY ---
const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    let accessToken = localStorage.getItem('accessToken');
    
    const makeRequest = async (token) => {
        const config = { method, headers: {} };

        if (!isFormData) {
            config.headers['Content-Type'] = 'application/json';
            if (body) config.body = JSON.stringify(body);
        } else {
            if (body) config.body = body;
        }

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (response.status === 401 || response.status === 403) {
            try {
                const newAccessToken = await refreshToken();
                return makeRequest(newAccessToken); 
            } catch (refreshError) {
                // If refresh fails, it will propagate the error, which is caught below.
                // We also need to specifically handle cases where the original error was not due to an expired token.
                const originalData = await response.json();
                const error = new Error(originalData.msg || refreshError.message);
                error.data = originalData; // Attach full data
                throw error;
            }
        }
        
        const data = await response.json();
        if (!response.ok) {
            // --- THIS IS THE FIX ---
            // Create a new Error object but also attach the full response data to it.
            // This preserves the 'details' object for the frontend to use.
            const error = new Error(data.msg || data.errors?.[0]?.msg || 'An API error occurred');
            error.data = data;
            throw error;
        }
        return data;
    };

    try {
        return await makeRequest(accessToken);
    } catch (error) {
        console.error('API call failed:', error.message);
        throw error;
    }
};