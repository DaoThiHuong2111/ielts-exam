import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import RegisterPage from '../index';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

global.fetch = jest.fn();

describe('RegisterPage', () => {
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

  it('renders the registration form correctly', () => {
    render(<RegisterPage />);
    
    expect(screen.getByText('Tạo tài khoản')).toBeInTheDocument();
    expect(screen.getByLabelText('Họ và tên của bạn')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Số điện thoại')).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument();
    expect(screen.getByLabelText('Nhập lại mật khẩu')).toBeInTheDocument();
    expect(screen.getByText('Đồng ý với các Chính sách bảo mật')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đăng ký →' })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<RegisterPage />);
    
    const submitButton = screen.getByRole('button', { name: 'Đăng ký →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập họ tên')).toBeInTheDocument();
      expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
      expect(screen.getByText('Số điện thoại không hợp lệ')).toBeInTheDocument();
      expect(screen.getByText('Mật khẩu tối thiểu 6 ký tự')).toBeInTheDocument();
      expect(screen.getByText('Vui lòng nhập lại mật khẩu')).toBeInTheDocument();
      expect(screen.getByText('Bạn cần đồng ý với chính sách bảo mật')).toBeInTheDocument();
    });
  });

  it('shows password mismatch error', async () => {
    render(<RegisterPage />);
    
    await userEvent.type(screen.getByLabelText('Họ và tên của bạn'), 'Test User');
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Số điện thoại'), '1234567890');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'password123');
    await userEvent.type(screen.getByLabelText('Nhập lại mật khẩu'), 'differentpassword');
    await userEvent.click(screen.getByRole('checkbox'));
    
    const submitButton = screen.getByRole('button', { name: 'Đăng ký →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Mật khẩu nhập lại không khớp')).toBeInTheDocument();
    });
  });

  it('shows loading state during form submission', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );
    
    render(<RegisterPage />);
    
    await userEvent.type(screen.getByLabelText('Họ và tên của bạn'), 'Test User');
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Số điện thoại'), '1234567890');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'password123');
    await userEvent.type(screen.getByLabelText('Nhập lại mật khẩu'), 'password123');
    await userEvent.click(screen.getByRole('checkbox'));
    
    const submitButton = screen.getByRole('button', { name: 'Đăng ký →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Đang đăng ký...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it('handles successful registration', async () => {
    const mockResponse = {
      message: 'Đăng ký thành công',
      user: {
        id: 'user-id-123',
        name: 'Test User',
        email: 'test@example.com',
      },
      auth: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      },
    };
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    
    render(<RegisterPage />);
    
    await userEvent.type(screen.getByLabelText('Họ và tên của bạn'), 'Test User');
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Số điện thoại'), '1234567890');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'password123');
    await userEvent.type(screen.getByLabelText('Nhập lại mật khẩu'), 'password123');
    await userEvent.click(screen.getByRole('checkbox'));
    
    const submitButton = screen.getByRole('button', { name: 'Đăng ký →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          username: 'test0',
          email: 'test@example.com',
          phoneNumber: '1234567890',
          password: 'password123',
          confirmPassword: 'password123',
        }),
      });
    });
    
    expect(toast.success).toHaveBeenCalledWith('Đăng ký thành công! Đang chuyển hướng...');
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    }, { timeout: 2000 });
  });

  it('handles registration error - email already exists', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({
        message: 'Email đã được sử dụng',
        error: 'CONFLICT',
      }),
    });
    
    render(<RegisterPage />);
    
    await userEvent.type(screen.getByLabelText('Họ và tên của bạn'), 'Test User');
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Số điện thoại'), '1234567890');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'password123');
    await userEvent.type(screen.getByLabelText('Nhập lại mật khẩu'), 'password123');
    await userEvent.click(screen.getByRole('checkbox'));
    
    const submitButton = screen.getByRole('button', { name: 'Đăng ký →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email đã được sử dụng');
    });
  });

  it('handles registration error - username already exists', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({
        message: 'Tên đăng nhập đã tồn tại',
        error: 'CONFLICT',
      }),
    });
    
    render(<RegisterPage />);
    
    await userEvent.type(screen.getByLabelText('Họ và tên của bạn'), 'Test User');
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Số điện thoại'), '1234567890');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'password123');
    await userEvent.type(screen.getByLabelText('Nhập lại mật khẩu'), 'password123');
    await userEvent.click(screen.getByRole('checkbox'));
    
    const submitButton = screen.getByRole('button', { name: 'Đăng ký →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Tên đăng nhập đã tồn tại');
    });
  });

  it('handles network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<RegisterPage />);
    
    await userEvent.type(screen.getByLabelText('Họ và tên của bạn'), 'Test User');
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Số điện thoại'), '1234567890');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'password123');
    await userEvent.type(screen.getByLabelText('Nhập lại mật khẩu'), 'password123');
    await userEvent.click(screen.getByRole('checkbox'));
    
    const submitButton = screen.getByRole('button', { name: 'Đăng ký →' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Đăng ký thất bại. Vui lòng thử lại.');
    });
  });

  it('toggles password visibility', async () => {
    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText('Mật khẩu');
    const confirmPasswordInput = screen.getByLabelText('Nhập lại mật khẩu');
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
});