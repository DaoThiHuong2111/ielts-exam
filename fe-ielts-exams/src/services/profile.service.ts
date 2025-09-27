import { clientService } from '@/lib/axios';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phoneNumber?: string;
  phone?: string; // Keep for backward compatibility
  role?: string;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
}

/**
 * Service for managing user profile operations
 */
export class ProfileService {
  /**
   * Get current user profile
   */
  static async getProfile(): Promise<ProfileServiceResponse<UserProfile>> {
    try {
      const response = await clientService.get('/api/user/profile');
      
      return {
        success: true,
        data: response.data,
        message: 'Lấy thông tin người dùng thành công',
      };
    } catch (error: any) {
      // Don't log 401 errors as they're expected when user is not authenticated
      if (error.response?.status !== 401) {
        console.error('Get profile error:', error);
      }

      return {
        success: false,
        message: error.response?.data?.message || 'Lấy thông tin người dùng thất bại',
        errors: error.response?.data?.errors,
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    data: UpdateProfileRequest
  ): Promise<ProfileServiceResponse<UserProfile>> {
    try {
      const response = await clientService.put('/api/user/profile', data);
      
      return {
        success: true,
        data: response.data,
        message: 'Cập nhật thông tin thành công',
      };
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Cập nhật thông tin thất bại',
        errors: error.response?.data?.errors,
      };
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    data: ChangePasswordRequest
  ): Promise<ProfileServiceResponse> {
    try {
      const response = await clientService.post('/api/user/change-password', data);
      
      return {
        success: true,
        message: response.data.message || 'Đổi mật khẩu thành công',
      };
    } catch (error: any) {
      console.error('Change password error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Đổi mật khẩu thất bại',
        errors: error.response?.data?.errors,
      };
    }
  }


  /**
   * Validate profile update data
   */
  static validateProfileData(data: UpdateProfileRequest): string[] {
    const errors: string[] = [];

    // Validate full name
    if (data.fullName) {
      if (data.fullName.trim().length < 2) {
        errors.push('Họ và tên phải có ít nhất 2 ký tự');
      }
      // Check if it has at least 2 words (first name and last name)
      const nameParts = data.fullName.trim().split(/\s+/);
      if (nameParts.length < 2) {
        errors.push('Vui lòng nhập họ và tên đầy đủ');
      }
    }

    // Validate phone number
    if (data.phone) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push('Số điện thoại không hợp lệ');
      }
    }

    return errors;
  }

  /**
   * Validate password change data
   */
  static validatePasswordData(data: ChangePasswordRequest): string[] {
    const errors: string[] = [];

    // Validate current password
    if (!data.currentPassword || data.currentPassword.length < 6) {
      errors.push('Mật khẩu hiện tại không hợp lệ');
    }

    // Validate new password
    if (!data.newPassword || data.newPassword.length < 8) {
      errors.push('Mật khẩu mới phải có ít nhất 8 ký tự');
    }

    // Validate password confirmation
    if (data.newPassword !== data.confirmPassword) {
      errors.push('Mật khẩu xác nhận không khớp');
    }

    // Check if new password is same as current password
    if (data.newPassword === data.currentPassword) {
      errors.push('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    return errors;
  }

}