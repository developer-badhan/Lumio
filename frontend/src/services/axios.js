import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true, // required for httpOnly refreshToken cookie
});


// Request Interceptor 
api.interceptors.request.use((config) => {
  const token       = localStorage.getItem("token");
  const verifyToken = localStorage.getItem("verifyToken");

  const isOtpRoute =
    config.url?.includes("/auth/verify-otp") ||
    config.url?.includes("/auth/otp-resend");

  if (isOtpRoute) {
    // OTP routes exclusively use verifyToken (VERIFY_TOKEN secret)
    if (verifyToken) {
      config.headers.Authorization = `Bearer ${verifyToken}`;
    }
    return config;
  }

  // All other routes use the standard access token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// Token Refresh Queue 
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};


// Response Interceptor
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // OTP routes use VERIFY_TOKEN secret — a 401 here means the verify session
    const isVerifyRoute =
      originalRequest.url.includes("/auth/verify-otp") ||
      originalRequest.url.includes("/auth/otp-resend");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isVerifyRoute
    ) {
      // Queue parallel 401s while a refresh is already in-flight
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing            = true;

      try {
        // Refresh cookie is httpOnly — sent automatically via withCredentials
        const { data } = await api.post("/auth/refresh-token");
        const newToken  = data.accessToken;

        localStorage.setItem("token", newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("token");

        // Don't redirect if user is mid-OTP registration flow
        if (!window.location.pathname.includes("/verify-otp")) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;