import axios from 'axios';

export const createAuthAxios = (config) => {
    const instance = axios.create(config);
    
    instance.interceptors.request.use((req) => {
        const sessionId = localStorage.getItem('session_id');
        if (sessionId) {
            req.headers = req.headers || {};
            req.headers['x-session-id'] = sessionId;
        }
        return req;
    });

    instance.interceptors.response.use(
        (res) => res, 
        (err) => {
            if (err.response && err.response.status === 401) {
                if (err.response.data && err.response.data.force_logout) {
                    console.warn("Session expired. Forcing logout via Axios...");
                    localStorage.clear();
                    window.location.href = '/login';
                }
            }
            return Promise.reject(err);
        }
    );

    return instance;
};

// Also export a configured default global instance
export const authAxios = createAuthAxios({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api'
});
