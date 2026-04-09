import axios from 'axios';

// Production API: Hugging Face Space backend
const HF_API = 'https://creoed-creoedlms.hf.space/api';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || HF_API,
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
