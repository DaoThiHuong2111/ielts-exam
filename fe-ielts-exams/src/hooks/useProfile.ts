import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ProfileService, 
  UserProfile, 
  UpdateProfileRequest, 
  ChangePasswordRequest,
  ProfileServiceResponse 
} from '@/services/profile.service';

/**
 * Hook for managing user profile
 */
export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  /**
   * Load user profile
   */
  const loadProfile = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ProfileService.getProfile();
      
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lấy thông tin người dùng thất bại';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (
    data: UpdateProfileRequest
  ): Promise<ProfileServiceResponse<UserProfile>> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate data
      const validationErrors = ProfileService.validateProfileData(data);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: validationErrors,
        };
      }

      const response = await ProfileService.updateProfile(data);
      
      if (response.success && response.data) {
        setProfile(response.data);
        return response;
      } else {
        setError(response.message);
        return response;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cập nhật thông tin thất bại';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Change password
   */
  const changePassword = async (
    data: ChangePasswordRequest
  ): Promise<ProfileServiceResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate data
      const validationErrors = ProfileService.validatePasswordData(data);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: validationErrors,
        };
      }

      const response = await ProfileService.changePassword(data);
      
      if (!response.success) {
        setError(response.message);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đổi mật khẩu thất bại';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Upload avatar
   */
  const uploadAvatar = async (
    file: File
  ): Promise<ProfileServiceResponse<{ avatarUrl: string }>> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate file
      const validationErrors = ProfileService.validateAvatarFile(file);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'File không hợp lệ',
          errors: validationErrors,
        };
      }

      const response = await ProfileService.uploadAvatar(file);
      
      if (response.success && response.data) {
        // Update profile with new avatar URL
        if (profile) {
          setProfile({
            ...profile,
            avatar: response.data.avatarUrl,
          });
        }
        return response;
      } else {
        setError(response.message);
        return response;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tải lên ảnh đại diện thất bại';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete avatar
   */
  const deleteAvatar = async (): Promise<ProfileServiceResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ProfileService.deleteAvatar();
      
      if (response.success) {
        // Update profile to remove avatar
        if (profile) {
          setProfile({
            ...profile,
            avatar: undefined,
          });
        }
        return response;
      } else {
        setError(response.message);
        return response;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Xóa ảnh đại diện thất bại';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get full name
   */
  const getFullName = (): string => {
    if (!profile) return '';
    
    const { firstName, lastName, username } = profile;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    if (lastName) {
      return lastName;
    }
    
    return username;
  };

  /**
   * Get display name (fallback to username if no name is set)
   */
  const getDisplayName = (): string => {
    const fullName = getFullName();
    return fullName || profile?.username || '';
  };

  /**
   * Get initials for avatar placeholder
   */
  const getInitials = (): string => {
    if (!profile) return '';
    
    const { firstName, lastName, username } = profile;
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    
    if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    
    return 'U'; // Fallback to 'U' for User
  };

  /**
   * Check if profile is complete
   */
  const isProfileComplete = (): boolean => {
    if (!profile) return false;
    
    return !!(profile.firstName && profile.lastName);
  };

  /**
   * Clear error
   */
  const clearError = (): void => {
    setError(null);
  };

  return {
    profile,
    isLoading,
    error,
    loadProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar,
    getFullName,
    getDisplayName,
    getInitials,
    isProfileComplete,
    clearError,
  };
}

/**
 * Hook for profile form state management
 */
export function useProfileForm(initialData?: Partial<UpdateProfileRequest>) {
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    phone: initialData?.phone || '',
    avatar: initialData?.avatar || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Handle input change
   */
  const handleChange = (field: keyof UpdateProfileRequest, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  /**
   * Handle blur event
   */
  const handleBlur = (field: keyof UpdateProfileRequest): void => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
    
    // Validate field on blur
    validateField(field);
  };

  /**
   * Validate a single field
   */
  const validateField = (field: keyof UpdateProfileRequest): void => {
    const fieldData = { [field]: formData[field] } as UpdateProfileRequest;
    const validationErrors = ProfileService.validateProfileData(fieldData);
    
    if (validationErrors.length > 0) {
      setErrors(prev => ({
        ...prev,
        [field]: validationErrors[0],
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Validate all fields
   */
  const validateForm = (): boolean => {
    const validationErrors = ProfileService.validateProfileData(formData);
    
    if (validationErrors.length > 0) {
      // Convert array of errors to object
      const errorObject: Record<string, string> = {};
      validationErrors.forEach(error => {
        // Simple mapping of error messages to fields
        if (error.includes('Họ')) errorObject.firstName = error;
        else if (error.includes('Tên')) errorObject.lastName = error;
        else if (error.includes('Số điện thoại')) errorObject.phone = error;
      });
      
      setErrors(errorObject);
      return false;
    }
    
    setErrors({});
    return true;
  };

  /**
   * Reset form
   */
  const resetForm = (): void => {
    setFormData({
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      phone: initialData?.phone || '',
      avatar: initialData?.avatar || '',
    });
    setErrors({});
    setTouched({});
  };

  /**
   * Check if form is valid
   */
  const isValid = (): boolean => {
    return Object.keys(errors).length === 0 && 
           Object.values(formData).some(value => value.trim() !== '');
  };

  /**
   * Check if field has error
   */
  const hasError = (field: keyof UpdateProfileRequest): boolean => {
    return !!errors[field] && touched[field];
  };

  return {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    resetForm,
    isValid,
    hasError,
  };
}