import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ResetPasswordForm from '../index';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

global.fetch = jest.fn();

describe('ResetPasswordForm', () => {
  const mockPush = jest.fn();
  const mockToken = 'test-reset-token-123';
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (fetch as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
    (toast.error as jest.Mock).mockClear();
    mockPush.mockClear();
  });

  it('renders the reset password form correctly', () => {
    render(<ResetPasswordForm token={mockToken} />);
    
    expect(screen.getByText('Đặt lại mật khẩu')).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu mới')).toBeInTheDocument();
    expect(screen.getByLabelText('Xác nhận mật khẩu mới')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đặt lại mật khẩu →' })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<ResetPasswordForm token={mockToken} />);
    
    const submitButton = screen.getByRole('button', { name: 'Đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Mật khẩu tối thiểu 6 ký tự')).toBeInTheDocument();
      expect(screen.getByText('Vui lòng nhập lại mật khẩu')).toBeInTheDocument();
    });
  });

  it('shows password mismatch error', async () => {
    render(<ResetPasswordForm token={mockToken} />);
    
    await userEvent.type(screen.getByLabelText('Mật khẩu mới'), 'password123');
    await userEvent.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'differentpassword');
    
    const submitButton = screen.getByRole('button', { name: 'Đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Mật khẩu nhập lại không khớp')).toBeInTheDocument();
    });
  });

  it('shows loading state during form submission', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );
    
    render(<ResetPasswordForm token={mockToken} />);
    
    await userEvent.type(screen.getByLabelText('Mật khẩu mới'), 'password123');
    await userEvent.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'password123');
    
    const submitButton = screen.getByRole('button', { name: 'Đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Đang đặt lại...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it('handles successful password reset', async () => {
    const mockResponse = {
      message: 'Đặt lại mật khẩu thành công',
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    
    render(<ResetPasswordForm token={mockToken} />);
    
    await userEvent.type(screen.getByLabelText('Mật khẩu mới'), 'password123');
    await userEvent.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'password123');
    
    const submitButton = screen.getByRole('button', { name: 'Đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'password123',
          confirmPassword: 'password123',
          token: mockToken,
        }),
      });
    });
    
    expect(toast.success).toHaveBeenCalledWith('Đặt lại mật khẩu thành công!');
    
    // Check if success state is shown
    await waitFor(() => {
      expect(screen.getByText('Mật khẩu đã được đặt lại!')).toBeInTheDocument();
      expect(screen.getByText('Mật khẩu của bạn đã được cập nhật thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.')).toBeInTheDocument();
    });
  });

  it('handles invalid token error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({
        message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
        error: 'INVALID_TOKEN',
      }),
    });
    
    render(<ResetPasswordForm token={mockToken} />);
    
    await userEvent.type(screen.getByLabelText('Mật khẩu mới'), 'password123');
    await userEvent.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'password123');
    
    const submitButton = screen.getByRole('button', { name: 'Đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    });
  });

  it('handles network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<ResetPasswordForm token={mockToken} />);
    
    await userEvent.type(screen.getByLabelText('Mật khẩu mới'), 'password123');
    await userEvent.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'password123');
    
    const submitButton = screen.getByRole('button', { name: 'Đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    });
  });

  it('toggles password visibility', async () => {
    render(<ResetPasswordForm token={mockToken} />);
    
    const passwordInput = screen.getByLabelText('Mật khẩu mới');
    const confirmPasswordInput = screen.getByLabelText('Xác nhận mật khẩu mới');
    const passwordToggle = screen.getAllByRole('button')[0]; // First toggle button
    const confirmPasswordToggle = screen.getAllByRole('button')[1]; // Second toggle button
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    
    await userEvent.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    await userEvent.click(confirmPasswordToggle);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    
    await userEvent.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await userEvent.click(confirmPasswordToggle);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('navigates to login page from success state', async () => {
    const mockResponse = {
      message: 'Đặt lại mật khẩu thành công',
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    
    render(<ResetPasswordForm token={mockToken} />);
    
    // First submission
    await userEvent.type(screen.getByLabelText('Mật khẩu mới'), 'password123');
    await userEvent.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'password123');
    const submitButton = screen.getByRole('button', { name: 'Đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Mật khẩu đã được đặt lại!')).toBeInTheDocument();
    });
    
    // Click login button
    const loginButton = screen.getByRole('button', { name: 'Đăng nhập ngay' });
    await userEvent.click(loginButton);
    
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('navigates to login page from form', async () => {
    render(<ResetPasswordForm token={mockToken} />);
    
    const loginLink = screen.getByText('Đăng nhập ngay');
    await userEvent.click(loginLink);
    
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});