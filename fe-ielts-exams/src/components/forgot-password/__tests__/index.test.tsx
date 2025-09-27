import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ForgotPasswordForm from '../index';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

global.fetch = jest.fn();

describe('ForgotPasswordForm', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (fetch as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
    (toast.error as jest.Mock).mockClear();
    mockPush.mockClear();
  });

  it('renders the forgot password form correctly', () => {
    render(<ForgotPasswordForm />);
    
    expect(screen.getByText('Quên mật khẩu')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu →' })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu →' });
    
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập email hợp lệ')).toBeInTheDocument();
    });
  });

  it('shows loading state during form submission', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );
    
    render(<ForgotPasswordForm />);
    
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Đang gửi...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it('handles successful forgot password request', async () => {
    const mockResponse = {
      message: 'Email đặt lại mật khẩu đã được gửi',
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    
    render(<ForgotPasswordForm />);
    
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });
    });
    
    expect(toast.success).toHaveBeenCalledWith('Email đặt lại mật khẩu đã được gửi!');
    
    // Check if success state is shown
    await waitFor(() => {
      expect(screen.getByText('Kiểm tra email của bạn')).toBeInTheDocument();
      expect(screen.getByText('Chúng tôi đã gửi một email chứa liên kết đặt lại mật khẩu đến địa chỉ email của bạn.')).toBeInTheDocument();
    });
  });

  it('handles forgot password error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({
        message: 'Email không tồn tại trong hệ thống',
        error: 'USER_NOT_FOUND',
      }),
    });
    
    render(<ForgotPasswordForm />);
    
    await userEvent.type(screen.getByLabelText('Email'), 'nonexistent@example.com');
    
    const submitButton = screen.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email không tồn tại trong hệ thống');
    });
  });

  it('handles network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<ForgotPasswordForm />);
    
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Gửi yêu cầu đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    });
  });

  it('allows resending email from success state', async () => {
    const mockResponse = {
      message: 'Email đặt lại mật khẩu đã được gửi',
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    
    render(<ForgotPasswordForm />);
    
    // First submission
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    const submitButton = screen.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Kiểm tra email của bạn')).toBeInTheDocument();
    });
    
    // Reset fetch mock for second submission
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    
    // Click resend button
    const resendButton = screen.getByRole('button', { name: 'Gửi lại email' });
    await userEvent.click(resendButton);
    
    // Should go back to form state
    await waitFor(() => {
      expect(screen.getByText('Quên mật khẩu')).toBeInTheDocument();
    });
  });

  it('navigates to login page from success state', async () => {
    const mockResponse = {
      message: 'Email đặt lại mật khẩu đã được gửi',
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    
    render(<ForgotPasswordForm />);
    
    // First submission
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    const submitButton = screen.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu →' });
    await userEvent.click(submitButton);
    
    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Kiểm tra email của bạn')).toBeInTheDocument();
    });
    
    // Click login button
    const loginButton = screen.getByRole('button', { name: 'Quay lại đăng nhập' });
    await userEvent.click(loginButton);
    
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('navigates to login page from form', async () => {
    render(<ForgotPasswordForm />);
    
    const loginLink = screen.getByText('Đăng nhập ngay');
    await userEvent.click(loginLink);
    
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});