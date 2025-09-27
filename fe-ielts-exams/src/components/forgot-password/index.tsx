"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import bannerContact from "@public/images/home/banner-contact.jpg"; // Ensure this path is correct
import { Loader2, MailCheck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Vui lòng nhập email hợp lệ"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gửi yêu cầu đặt lại mật khẩu thất bại');
      }

      // Show success message
      toast.success('Email đặt lại mật khẩu đã được gửi!');
      setIsSubmitted(true);
      
    } catch (error: any) {
      toast.error(error.message || 'Gửi yêu cầu đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
              <MailCheck className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-black">Kiểm tra email của bạn</h1>
            <p className="text-gray-600">
              Chúng tôi đã gửi một email chứa liên kết đặt lại mật khẩu đến địa chỉ email của bạn.
              Vui lòng kiểm tra hộp thư đến và làm theo hướng dẫn.
            </p>
            <p className="text-sm text-gray-500">
              Nếu bạn không nhận được email trong vài phút, vui lòng kiểm tra thư mục spam.
            </p>
            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="flex-1"
              >
                Gửi lại email
              </Button>
              <Button
                onClick={() => router.push('/login')}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                Quay lại đăng nhập
              </Button>
            </div>
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
          <h1 className="text-2xl font-bold text-black">Quên mật khẩu</h1>
          <p className="text-gray-600">
            Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
          </p>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              {...register("email")}
              type="email"
              placeholder="Nhập email của bạn"
              className="h-14 text-base"
              disabled={isLoading || isSubmitting}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message?.toString()}</p>}
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full bg-yellow-400 hover:bg-yellow-500 py-7 text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading || isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              'Gửi liên kết đặt lại mật khẩu →'
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