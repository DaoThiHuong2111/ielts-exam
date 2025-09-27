import { clientService } from '@/lib/axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
      username: string;
      role: string;
    };
  };
}

/**
 * Service for handling authentication operations
 */
export class AuthService {
  /**
   * Login user with email/username and password
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await clientService.post('/api/auth/login', {
        username: email, // Backend expects username field
        password,
      });

      return {
        success: true,
        message: 'Đăng nhập thành công',
        data: response.data,
      };
    } catch (error: any) {
      console.error('Login error:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.',
      };
    }
  }

  /**
   * Register new user
   */
  static async register(userData: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
  }): Promise<LoginResponse> {
    try {
      const response = await clientService.post('/api/auth/register', userData);

      return {
        success: true,
        message: 'Đăng ký thành công',
        data: response.data,
      };
    } catch (error: any) {
      console.error('Register error:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.',
      };
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await clientService.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, we'll clear local state
    }
  }

  /**
   * Validate login credentials
   */
  static validateCredentials(data: LoginCredentials): string[] {
    const errors: string[] = [];

    // Validate email/username
    if (!data.email || data.email.trim().length < 1) {
      errors.push('Vui lòng nhập email hoặc tên đăng nhập');
    }

    // Validate password
    if (!data.password || data.password.length < 8) {
      errors.push('Mật khẩu tối thiểu 8 ký tự');
    }

    return errors;
  }
}

// Export login function for backward compatibility
export const login = AuthService.login.bind(AuthService);