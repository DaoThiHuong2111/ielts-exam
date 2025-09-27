"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import bannerContact from "@public/images/home/banner-contact.jpg"; // Ensure this path is correct
import { login } from "@/services/auth.service";
import { Eye, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const { refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  console.log('Login component rendering');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (value.trim()) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: ''
    };

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email hoặc tên đăng nhập';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted with data:', formData);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Backend expects username field, not email
      const result = await login(formData.email, formData.password);
      console.log('Login result:', result);

      if (result.success) {
        toast.success('Đăng nhập thành công!')

        // Refresh user data to update AuthContext
        await refreshUser()

        // Small delay to allow state update
        setTimeout(() => {
          window.location.href = '/'
        }, 500);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      // Xử lý lỗi và hiển thị thông báo cho user
      const errorMessage = error?.message || error?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.';
      console.error('Login error:', error);
      toast.error(errorMessage);
      // Giữ nguyên tại trang login, không redirect
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="absolute z-[1] inset-0 top-0 left-0 w-full">
        <Image
          src={bannerContact}
          alt="Support Form"
          fill
          className="w-full h-auto object-cover"
          priority
        />
      </div>
      <div className="hidden md:block"></div>
      <div className="relative container z-10 flex items-center justify-center">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-[600px] bg-white rounded-2xl shadow p-8 space-y-6"
        >
          <h1 className="text-2xl font-bold text-black">Đăng nhập ngay!</h1>

          <div>
            <label className="block text-sm font-medium mb-1">Email/ Tên Đăng Nhập</label>
            <Input
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Nhập email hoặc tên đăng nhập"
              className="h-14 text-base"
              suppressHydrationWarning
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mật Khẩu</label>
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Nhập mật khẩu"
                className="h-14 text-base"
                suppressHydrationWarning
              />
              <Eye
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <label htmlFor="remember" className="text-sm text-muted-foreground">
                Lưu thông tin
              </label>
            </div>
            <a href="/forgot-password" className="text-sm text-primary hover:underline">Quên mật khẩu?</a>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-yellow-400 hover:bg-yellow-500 py-7 text-black disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...
              </>
            ) : (
              'Đăng nhập →'
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản? <a href="/register" className="text-black font-semibold hover:underline">Đăng ký tài khoản</a>
          </p>
        </form>
      </div>
    </section>
  );
}