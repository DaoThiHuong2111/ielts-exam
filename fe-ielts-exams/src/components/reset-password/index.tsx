"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import bannerContact from "@public/images/home/banner-contact.jpg"; // Ensure this path is correct
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirmPassword: z.string().min(6, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword']
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
        }
        throw new Error(result.message || 'Đặt lại mật khẩu thất bại');
      }

      // Show success message
      toast.success('Đặt lại mật khẩu thành công!');
      setIsSuccess(true);
      
    } catch (error: any) {
      toast.error(error.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <section className="relative min-h-screen grid grid-cols-1">
        <div className="absolute z-[1] inset-0 top-0 left-0 w-full">
          <Image
            src={bannerContact}
            alt="Support Form"
            fill
            className="w-full h-auto object-cover"
            priority
          />
        </div>
        <div className="relative container z-10 flex items-center justify-center">
          <div className="w-full max-w-[600px] bg-white rounded-2xl shadow p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <LockKeyhole className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-black">Mật khẩu đã được đặt lại!</h1>
            <p className="text-gray-600">
              Mật khẩu của bạn đã được cập nhật thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="mt-6 bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              Đăng nhập ngay
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen grid grid-cols-1">
      <div className="absolute z-[1] inset-0 top-0 left-0 w-full">
        <Image
          src={bannerContact}
          alt="Support Form"
          fill
          className="w-full h-auto object-cover"
          priority
        />
      </div>
      <div className="relative container z-10 flex items-center justify-center">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-[600px] bg-white rounded-2xl shadow p-8 space-y-6"
        >
          <h1 className="text-2xl font-bold text-black">Đặt lại mật khẩu</h1>
          <p className="text-gray-600">
            Vui lòng nhập mật khẩu mới của bạn.
          </p>

          <div className="relative">
            <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
            <div className="relative">
              <Input 
                {...register("password")}
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới"
                className="h-14 text-base pr-10"
                disabled={isLoading || isSubmitting}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message?.toString()}</p>}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <Input 
                {...register("confirmPassword")}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu mới"
                className="h-14 text-base pr-10"
                disabled={isLoading || isSubmitting}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message?.toString()}</p>}
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || isSubmitting}
            className="w-full bg-yellow-400 hover:bg-yellow-500 py-7 text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading || isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đặt lại...
              </>
            ) : (
              'Đặt lại mật khẩu →'
            )}
          </Button>

          <div className="text-center pt-4">
            <p className="text-sm">
              Đã nhớ mật khẩu?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}