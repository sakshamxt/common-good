// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // From .env.development or .env.production
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: To add JWT token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    // We'll get the token from AuthContext or localStorage in the next sections
    const token = localStorage.getItem('commonGoodToken'); // Placeholder
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: To handle global errors, e.g., 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    console.error('API Error:', error.response || error.message);

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        // Handle 401 Unauthorized (e.g., token expired)
        // We will implement proper logout and redirect via AuthContext later
        console.log('Unauthorized access - 401. Clearing token and redirecting to login.');
        localStorage.removeItem('commonGoodToken'); // Placeholder
        // window.location.href = '/login'; // Force redirect
        // A better way would be to use useNavigate hook, but that's for components.
        // Or dispatch an action if using a global state manager for auth.
      }
      // You can add more global error handling here (e.g., for 403, 500)
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error or No Response:', error.request);
      // toast.error('Network error. Please check your connection.'); // Using react-hot-toast
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error); // Important to reject the promise so calling code can handle it
  }
);

export default axiosInstance;