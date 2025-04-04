
import axios from 'axios';
import { API_BASE_URL, AUTH_CONFIG, REQUEST_TIMEOUT } from '@/config/appConfig';

// Create axios instance with configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include auth token with each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_CONFIG.tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(AUTH_CONFIG.tokenKey);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData: {
    name: string;
    email: string;
    password: string;
    department: string;
    semester: string;
    courses: string[];
  }) => api.post('/auth/register', userData),
  
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem(AUTH_CONFIG.tokenKey);
    return Promise.resolve();
  }
};

// Courses API endpoints
export const coursesAPI = {
  getAllCourses: () => api.get('/courses'),
};

// Exams API endpoints
export const examsAPI = {
  createExam: (examData: {
    examType: string;
    semester: string;
    courseId: string;
  }) => api.post('/exams', examData),
  
  getEducatorExams: () => api.get('/exams'),
};

export default api;
