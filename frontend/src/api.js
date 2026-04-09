import axios from 'axios';

// Automatically points to your live Hugging Face backend API
const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'https://creoed-creoedlms.hf.space') + '/api',
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
