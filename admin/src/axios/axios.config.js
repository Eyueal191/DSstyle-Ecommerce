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
  // use relative origin ("") so requests route via Vercel rewrites or reverse proxy.
  if (import.meta.env.PROD) {
    return "";
  }

  return "http://localhost:8080";
};

// ✅ Create Axios instance
const Axios = axios.create({
  baseURL: getBaseUrl(),
  timeout: 600000,
  withCredentials: true, // 🔥 ensures cookies (refreshToken) are sent automatically
});
// ✅ Request interceptor – attach access token
Axios.interceptors.request.use(
  (request) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      // Lowercase 'authorization' matches Express convention
      request.headers["authorization"] = `Bearer ${accessToken}`;
    }
    return request;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor – handle expired access token
Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const response = error.response;

    // If no response (network error), just reject
    if (!response) return Promise.reject(error);

    // 🔁 Case 1: Access token expired
    if (
      response.status === 401 &&
      response.data?.message?.toLowerCase().includes("access token has expired")
    ) {
      // Prevent infinite retry loop
      if (!originalRequest._isRetry) {
        originalRequest._isRetry = true;

        try {
          // 🔥 Call refresh endpoint (sends refreshToken cookie automatically)
          const refreshResponse = await Axios.get("/api/user/refresh-access-token", {
            withCredentials: true, // redundant but extra-safe
          });

          const newToken = refreshResponse.data?.accessToken;
          if (newToken) {
            localStorage.setItem("accessToken", newToken);
            // Retry the original request with the new token
            originalRequest.headers["authorization"] = `Bearer ${newToken}`;
            return Axios(originalRequest);
          } else {
            // If no token returned, force logout
            throw new Error("No new access token received");
          }
        } catch (refreshError) {
          // 🔒 Refresh token expired or invalid → force logout
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("email");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }

    // 🔒 Case 2: Refresh token expired or invalid
    if (
      response.status === 401 &&
      response.data?.message?.toLowerCase().includes("refresh token expired")
    ) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("email");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default Axios;
