import axios from "axios";

// Environment-driven Backend API base URL for Local, Vercel, and Production deployments
const getBaseUrl = () => {
  const envUrl =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_SERVER_URL;

  if (typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // When deployed to production (e.g., Vercel) without an explicit external backend URL,
  // use relative origin ("") so requests like Axios.get('/api/product') route via
  // Vercel rewrites or reverse proxy rather than failing to reach localhost:8080.
  if (import.meta.env.PROD) {
    return "";
  }

  return "http://localhost:8080";
};

// Create Axios instance
const Axios = axios.create({
  baseURL: getBaseUrl(),
  timeout: 600000,
  withCredentials: true,
});

// Response interceptor
Axios.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default Axios;
