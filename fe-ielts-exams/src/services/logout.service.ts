// Token utils không còn cần thiết với httpOnly cookies
// import { clearAuthTokens, redirectToLogin } from '@/lib/token-utils';
import { clientService } from '@/lib/axios';

export interface LogoutResult {
  success: boolean;
  message: string;
  backendError?: string;
  cookieError?: string;
}

/**
 * Service for handling logout functionality
 */
export class LogoutService {
  /**
   * Perform logout by calling backend API and clearing local tokens
   */
  static async logout(): Promise<LogoutResult> {
    try {
      // Call backend logout API
      const response = await clientService.post('/api/auth/logout');
      const data = response.data;

      // Với httpOnly cookies, không cần clear tokens thủ công
      // Backend API đã xóa cookies

      return {
        success: true,
        message: data.message || 'Đăng xuất thành công',
        backendError: data.backendError || undefined,
        cookieError: data.cookieError || undefined,
      };
    } catch (error) {
      console.error('Logout error:', error);

      // Với httpOnly cookies, không cần clear tokens thủ công

      // Extract error message
      let errorMessage = 'Đăng xuất thành công (lỗi kết nối)';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      return {
        success: true, // Still consider logout successful if tokens are cleared
        message: errorMessage,
        backendError: errorMessage,
      };
    }
  }

  /**
   * Perform logout with confirmation dialog
   */
  static async logoutWithConfirmation(): Promise<LogoutResult> {
    // Show confirmation dialog
    const isConfirmed = confirm('Bạn có chắc chắn muốn đăng xuất?');

    if (!isConfirmed) {
      return {
        success: false,
        message: 'Đăng xuất đã bị hủy',
      };
    }

    return await this.logout();
  }

  /**
   * Force logout without confirmation (for error cases)
   */
  static async forceLogout(): Promise<LogoutResult> {
    try {
      // Call backend logout API
      await clientService.post('/api/auth/logout').catch(() => {
        // Ignore API errors for force logout
      });

      // Với httpOnly cookies, không cần clear tokens thủ công
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      return {
        success: true,
        message: 'Đã đăng xuất',
      };
    } catch (error) {
      // Even if everything fails, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      return {
        success: true,
        message: 'Đã đăng xuất (có lỗi xảy ra)',
      };
    }
  }

  /**
   * Check if user should be logged out (e.g., token expired)
   */
  static async shouldLogout(): Promise<boolean> {
    try {
      // Kiểm tra bằng cách gọi API (sẽ tự động gửi httpOnly cookies)
      const response = await clientService.get('/api/user/profile');
      return response.status !== 200;
    } catch (error) {
      // Nếu API thất bại, nên logout
      return true;
    }
  }

  /**
   * Auto-logout if token is expired
   */
  static async autoLogoutIfNeeded(): Promise<boolean> {
    if (await this.shouldLogout()) {
      await this.forceLogout();
      return true;
    }
    return false;
  }
}