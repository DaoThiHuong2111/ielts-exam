import axios, { AxiosResponse } from 'axios';

export const clientService = axios.create({
  baseURL: '', // Gọi đến Next.js API routes (cùng domain)
  withCredentials: true, // Tự động gửi cookies (bao gồm httpOnly)
  timeout: 10000,
});

// Enhanced request interceptor
clientService.interceptors.request.use(
  (config) => {
    // Browser tự động gửi cookies nhờ withCredentials: true
    return config;
  },
  (error) => Promise.reject(error)
);

// Enhanced response interceptor với xử lý 401 tự động
clientService.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Log lỗi chi tiết (trừ 401 cho profile requests)
    if (error.response?.status) {
      const requestUrl = error.config?.url || '';
      const is401ProfileRequest = error.response.status === 401 && requestUrl.includes('/profile');

      if (!is401ProfileRequest) {
        console.error(`API Error ${error.response.status}:`, error.response.data);
      }

      // Xử lý 401 Unauthorized
      if (error.response.status === 401) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const requestUrl = error.config?.url || '';

        // Chỉ redirect nếu:
        // 1. Không phải đang ở login/register page
        // 2. Không phải là request profile (để tránh loop khi check authentication)
        // 3. Không phải là request login
        if (!currentPath.match(/^\/(login|register)/) &&
            !requestUrl.includes('/profile') &&
            !requestUrl.includes('/auth/login')) {

          console.warn('Token expired or invalid, clearing auth and redirecting to login');

          // Import dynamically để tránh circular dependency
          import('./token-utils').then(({ clearAuthTokens, redirectToLogin }) => {
            clearAuthTokens();
            redirectToLogin();
          }).catch(console.error);
        } else {
          // Đây là 401 bình thường khi chưa đăng nhập, không cần log error
          console.log('Authentication required for:', requestUrl);
        }
      }
    } else if (error.request) {
      console.error('Network Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);